import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { calendar, calendar_v3 } from '@googleapis/calendar';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateGoogleDto } from './dto/create-google.dto';

@Injectable()
export class GoogleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private async initializeOAuth2Client(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      select: {
        googleId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleScopes: true,
        syncWithGoogleCalendar: true,
        googleTokenExpiryDate: true,
      },
    });

    if (!user || !user.googleId) {
      throw new UnauthorizedException('User not found or no Google ID');
    }

    if (!user.syncWithGoogleCalendar) {
      throw new BadRequestException(
        'Google Calendar synchronization is disabled for this user',
      );
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      throw new UnauthorizedException(
        'No access or refresh token available. Please authenticate with Google.',
      );
    }

    const oauth2Client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiryDate
        ? user.googleTokenExpiryDate.getTime()
        : undefined,
    });

    const currentTime = new Date();
    if (
      user.googleTokenExpiryDate &&
      user.googleTokenExpiryDate <= currentTime
    ) {
      // console.log('Access token expired. Attempting to refresh...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await this.prisma.user.update({
          where: { googleId: user.googleId },
          data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiryDate: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : null,
          },
        });
        oauth2Client.setCredentials({
          access_token: credentials.access_token,
          refresh_token: user.googleRefreshToken,
          expiry_date: credentials.expiry_date,
        });
        // console.log(
        //   'Access token refreshed:',
        //   credentials.access_token?.slice(0, 20) + '...',
        // );
      } catch (error) {
        console.error('Error refreshing token:', error.message);
        throw new UnauthorizedException(
          'Failed to refresh Google access token',
        );
      }
    }

    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token && tokens.expiry_date) {
        await this.prisma.user.update({
          where: { googleId: user.googleId },
          data: {
            googleAccessToken: tokens.access_token,
            googleTokenExpiryDate: new Date(tokens.expiry_date),
          },
        });
        // console.log(
        //   'Refreshed Access Token:',
        //   tokens.access_token.slice(0, 20) + '...',
        //   'Expiry Date:',
        //   new Date(tokens.expiry_date).toISOString(),
        // );
      }
    });

    const requiredScopes = ['https://www.googleapis.com/auth/calendar.events'];
    const hasRequiredScopes = requiredScopes.every((scope) =>
      user.googleScopes.includes(scope),
    );
    if (!hasRequiredScopes) {
      throw new UnauthorizedException(
        'Insufficient scopes for Google Calendar event access. Please re-authenticate.',
      );
    }

    return { oauth2Client, user };
  }

  async createGoogleCalendarEvent(email: string, eventData: CreateGoogleDto) {
    const { oauth2Client, user } = await this.initializeOAuth2Client(email);
    // console.log('email : ', email);

    try {
      // console.log('Memory Usage Before Create Event:', process.memoryUsage());
      const calendarClient = calendar({ version: 'v3', auth: oauth2Client });

      const event: calendar_v3.Schema$Event = {
        summary: eventData.summary,
        location: eventData.location,
        description: eventData.description,
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone,
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone,
        },
        attendees: eventData.attendees,
        reminders: eventData.reminders,
      };

      const insertedEvent = await calendarClient.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: eventData.sendUpdates || 'none',
      });
      // console.log('Event Created:', insertedEvent.data.htmlLink);

      const attendeesJson =
        insertedEvent.data.attendees?.map((attendee) => ({
          email: attendee.email,
          responseStatus: attendee.responseStatus,
        })) || [];

      await this.prisma.calendarEvent.create({
        data: {
          googleEventId: insertedEvent.data.id,
          userId: user.googleId,
          summary: insertedEvent.data.summary,
          description: insertedEvent.data.description,
          location: insertedEvent.data.location,
          startDateTime: new Date(insertedEvent.data.start.dateTime),
          endDateTime: new Date(insertedEvent.data.end.dateTime),
          timeZone: insertedEvent.data.start.timeZone,
          htmlLink: insertedEvent.data.htmlLink,
          attendees: attendeesJson,
          createdAt: new Date(insertedEvent.data.created),
          updatedAt: new Date(insertedEvent.data.updated),
        },
      });
      // console.log('Event Disimpan ke Database:', insertedEvent.data.id);

      // console.log('Memory Usage After Create Event:', process.memoryUsage());

      return {
        createdEvent: insertedEvent.data,
      };
    } catch (error) {
      console.error('Error membuat event Google Calendar:', {
        message: error.message,
        code: error.code,
        details: error.errors,
      });
      throw new UnauthorizedException(
        `Gagal membuat event Google Calendar: ${error.message}`,
      );
    }
  }

  async getGoogleCalendarData(email: string) {
    const { oauth2Client } = await this.initializeOAuth2Client(email);
    // console.log('email : ', email);

    try {
      // console.log('Memory Usage Before Get Events:', process.memoryUsage());
      const calendarClient = calendar({ version: 'v3', auth: oauth2Client });

      const events = await calendarClient.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        timeMax: new Date('2025-08-29T00:00:00Z').toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      // console.log('Memory Usage After Get Events:', process.memoryUsage());

      console.log(
        'Jumlah Event Google Calendar:',
        events.data.items?.length || 0,
      );

      return {
        calendarEvents: events.data.items || [],
      };
    } catch (error) {
      console.error('Error mengambil data Google Calendar:', {
        message: error.message,
        code: error.code,
        details: error.errors,
      });
      throw new UnauthorizedException(
        `Gagal mengambil data Google Calendar: ${error.message}`,
      );
    }
  }

  async deleteGoogleCalendarEvent(email: string, googleEventId: string) {
    const { oauth2Client, user } = await this.initializeOAuth2Client(email);
    try {
      const calendarClient = calendar({ version: 'v3', auth: oauth2Client });
      const event = await this.prisma.calendarEvent.findFirst({
        where: {
          googleEventId,
          userId: user.googleId,
        },
      });

      if (!event) {
        throw new BadRequestException(
          'Event not found or does not belong to this user',
        );
      }

      await calendarClient.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
      });

      await this.prisma.calendarEvent.delete({
        where: {
          googleEventId,
        },
      });

      return {
        success: true,
        message: 'Event berhasil dihapus dari Google Calendar dan database.',
      };
    } catch (error) {
      console.error('Error menghapus event Google Calendar:', {
        message: error.message,
        code: error.code,
        details: error.errors,
      });
      throw new BadRequestException(
        `Gagal menghapus event Google Calendar: ${error.message}`,
      );
    }
  }

  async editGoogleCalendarEvent(
    email: string,
    googleEventId: string,
    eventData: CreateGoogleDto,
  ) {
    const { oauth2Client, user } = await this.initializeOAuth2Client(email);

    try {
      const calendarClient = calendar({ version: 'v3', auth: oauth2Client });
      const existingEvent = await this.prisma.calendarEvent.findFirst({
        where: {
          googleEventId,
          userId: user.googleId,
        },
      });

      if (!existingEvent) {
        throw new BadRequestException(
          'Event not found or does not belong to this user',
        );
      }

      const event: calendar_v3.Schema$Event = {
        summary: eventData.summary,
        location: eventData.location,
        description: eventData.description,
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone,
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone,
        },
        attendees: eventData.attendees,
        reminders: eventData.reminders,
      };

      const updatedEvent = await calendarClient.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        requestBody: event,
        sendUpdates: eventData.sendUpdates || 'all',
      });

      const attendeesJson =
        updatedEvent.data.attendees?.map((attendee) => ({
          email: attendee.email,
          responseStatus: attendee.responseStatus,
        })) || [];

      await this.prisma.calendarEvent.update({
        where: {
          googleEventId,
        },
        data: {
          summary: updatedEvent.data.summary,
          description: updatedEvent.data.description,
          location: updatedEvent.data.location,
          startDateTime: new Date(updatedEvent.data.start.dateTime),
          endDateTime: new Date(updatedEvent.data.end.dateTime),
          timeZone: updatedEvent.data.start.timeZone,
          htmlLink: updatedEvent.data.htmlLink,
          attendees: attendeesJson,
          updatedAt: new Date(updatedEvent.data.updated),
        },
      });

      return {
        updatedEvent: updatedEvent.data,
      };
    } catch (error) {
      console.error('Error mengedit event Google Calendar:', {
        message: error.message,
        code: error.code,
        details: error.errors,
      });
      throw new BadRequestException(
        `Gagal mengedit event Google Calendar: ${error.message}`,
      );
    }
  }

  async handleGoogleCallback(code: string, state: string) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
      const { email, googleId } = decodedState;

      const user = await this.prisma.user.findFirst({
        where: { email, googleId },
        select: { id: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid user in state parameter');
      }

      const oauth2Client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
      });

      const { tokens } = await oauth2Client.getToken(code);
      await this.prisma.user.update({
        where: { googleId },
        data: {
          googleAccessToken: tokens.access_token ?? '',
          googleRefreshToken: tokens.refresh_token ?? '',
          googleScopes: tokens.scope ?? '',
          googleTokenExpiryDate: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
          syncWithGoogleCalendar: true,
        },
      });

      return { message: 'Google Calendar sync enabled successfully' };
    } catch (error) {
      console.error('Error handling Google callback:', {
        message: error.message,
        code: error.code,
        details: error.errors,
      });
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }
}
