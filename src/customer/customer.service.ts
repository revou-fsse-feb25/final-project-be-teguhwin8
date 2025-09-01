import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import {
  isBlankish,
  isProvided,
  normalizeDate,
  toBool,
} from './utils/customer.utils';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class CustomerService {
  configService: any;
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  private async sendWhatsappMessage(phoneNumber: string, otp: string) {
    const customHeaders = {
      'Qiscus-App-Id': process.env.QISQUS_APP_ID,
      'Qiscus-Secret-Key': process.env.QISQUS_APP_SECRET,
      'Content-Type': 'application/json',
    };

    const component = [
      {
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: otp,
          },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: otp,
          },
        ],
      },
    ];

    const body = {
      to: phoneNumber,
      type: 'template',
      template: {
        namespace: '714fca3d_ead6_4ac8_a8f2_bf060f2205a7',
        name: 'himovy_authentication_otp',
        language: {
          policy: 'deterministic',
          code: 'id',
        },
        components: component,
      },
    };

    try {
      await this.globalService.whatsappQisqus(body, customHeaders);
      console.log('WhatsApp OTP sent successfully!');
    } catch (error) {
      console.error('Error sending WhatsApp OTP:', error);
      throw new Error('Failed to send WhatsApp OTP');
    }
  }

  async create(request: any) {
    try {
      const data = await this.prisma.customer.create({
        data: {
          code:
            request.code ||
            (await this.globalService.generateCustomerCode(this.prisma)),
          userId: request.userId,
          nik: request.nik,
          image: request.image,
          address: request.address,
          city: request.city,
          birthdayDate: request.birthdayDate,
          emergencyNumber: request.emergencyNumber,
        },
      });
      const result = await this.prisma.customer.findFirst({
        where: { id: data.id },
        include: {
          user: true,
          CustomerBank: true,
          CustomerPassenger: true,
        },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(request: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
    } = request ?? {};

    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;

    const userIdArray = Array.isArray(userId)
      ? userId
      : userId
      ? String(userId)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const whereConditions: any = {
      deletedAt: null,
      user: { deletedAt: null },
      ...(userIdArray ? { userId: { in: userIdArray } } : {}),
    };

    if (!isBlankish(search)) {
      const kw = String(search).trim();
      whereConditions.OR = [
        { code: { contains: kw, mode: 'insensitive' } },
        { nik: { contains: kw, mode: 'insensitive' } },
        { city: { contains: kw, mode: 'insensitive' } },
        { address: { contains: kw, mode: 'insensitive' } },
        { birthdayDate: { contains: kw, mode: 'insensitive' } },
        { emergencyNumber: { contains: kw, mode: 'insensitive' } },

        { user: { name: { contains: kw, mode: 'insensitive' } } },
        { user: { email: { contains: kw, mode: 'insensitive' } } },
        { user: { phoneNumber: { contains: kw, mode: 'insensitive' } } },
      ];
    }

    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'code',
      'city',
      'birthdayDate',
    ]);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'createdAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.customer.count({ where: whereConditions }),
        this.prisma.customer.findMany({
          where: whereConditions,
          include: {
            user: true,
          },
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
        }),
      ]);

      return {
        code: 200,
        message: 'Successfully',
        data: Array.isArray(datas) ? datas : [],
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
          hasNextPage: pageNum < Math.ceil(total / take),
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          userId: userIdArray ?? 'ANY',
          search: isBlankish(search) ? '' : search,
        },
      };
    } catch (error) {
      console.error('Failed to list customers:', error);
      throw new InternalServerErrorException('Failed to list customers');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { id, deletedAt: null },
            { userId: id, deletedAt: null },
          ],
        },
        include: {
          user: true,
          CustomerBank: true,
          CustomerPassenger: true,
        },
      });

      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any, file?: Express.Multer.File) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.customer.findUnique({
          where: { id },
          select: { id: true, userId: true, image: true },
        });
        if (!existing) throw new NotFoundException('Customer not found');
        const userPatch: Prisma.UserUpdateInput = {};
        if (isProvided(request.name)) userPatch.name = request.name;
        if (isProvided(request.email)) userPatch.email = request.email;
        if (isProvided(request.phoneNumber))
          userPatch.phoneNumber = request.phoneNumber;
        if (isProvided(request.password))
          userPatch.password = await bcrypt.hash(String(request.password), 10);
        let uploadedUrl: string | null = null;
        if (file) {
          const uploaded = await this.globalService.uploadFile({
            buffer: file.buffer,
            fileType: {
              ext: file.originalname?.split('.').pop(),
              mime: file.mimetype,
            },
          });
          uploadedUrl = uploaded?.Location ?? null;
          if (toBool(request.replaceImage) && existing.image) {
            const key = existing.image.split('/').pop();
            if (key) await this.globalService.deleteFileS3(key);
          }
        }
        const bd = normalizeDate(request.birthdayDate);
        const customerPatch: Prisma.CustomerUpdateInput = {
          ...(request.userId !== undefined ? { userId: request.userId } : {}),
          ...(request.nik !== undefined ? { nik: request.nik } : {}),
          ...(request.address !== undefined
            ? { address: request.address }
            : {}),
          ...(request.city !== undefined ? { city: request.city } : {}),
          ...(request.emergencyNumber !== undefined
            ? { emergencyNumber: request.emergencyNumber }
            : {}),
          ...(bd !== undefined ? { birthdayDate: bd.toISOString() } : {}),
          ...(uploadedUrl ? { image: uploadedUrl } : {}),
        };
        await tx.customer.update({ where: { id }, data: customerPatch });
        if (Object.keys(userPatch).length > 0) {
          const targetUserId = request.userId ?? existing.userId;
          await tx.user.update({
            where: { id: targetUserId },
            data: userPatch,
          });
        }
        const result = await tx.customer.findFirst({
          where: { id },
          include: { user: true, CustomerBank: true },
        });
        return {
          code: 200,
          message: 'Successfully',
          data: result,
        };
      });
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      if (e?.code === 'P2025') throw new NotFoundException('Record not found.');
      throw new InternalServerErrorException(e?.message || 'Something wrong.');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.customer.findUnique({
        where: { id, deletedAt: null },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async sendOtp(request: any) {
    try {
      const length = 6;
      const characters = '123456789';
      let otp = '';
      let validateOtp;
      do {
        otp = '';
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          otp += characters.charAt(randomIndex);
        }
        validateOtp = await this.prisma.user.findFirst({
          where: { otp: parseInt(otp) },
        });
      } while (validateOtp);

      const user = await this.prisma.user.findFirst({
        where: { phoneNumber: request.phoneNumber },
      });
      const role = await this.prisma.role.findFirst({
        where: { name: 'customer' },
      });
      const hashPassword = await bcrypt.hash('hijau123', 10);
      const library = await this.prisma.library.findFirst({
        where: { code: 'TRV' },
      });

      if (request.forgot)
        await this.sendWhatsappMessage(request.phoneNumber, otp);
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: request.name,
            type: 'customer',
            otp: parseInt(otp),
            roleId: role.id,
            password: hashPassword,
            createdAt: new Date(),
            operatorId: library ? library.id : null,
          },
        });
        return this.globalService.response('OTP sent successfully', {
          userId: user.id,
          phoneNumber: request.phoneNumber,
        });
      } else {
        await this.prisma.user.create({
          data: {
            name: request.name,
            type: 'customer',
            phoneNumber: request.phoneNumber,
            otp: parseInt(otp),
            roleId: role.id,
            password: hashPassword,
            createdAt: new Date(),
            operatorId: library ? library.id : null,
          },
        });
        await this.sendWhatsappMessage(request.phoneNumber, otp);
        return this.globalService.response('OTP sent successfully', {
          phoneNumber: request.phoneNumber,
          otp,
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      throw new InternalServerErrorException('Failed to send OTP');
    }
  }

  async verifyOtp(body: any) {
    try {
      const { otp, address, phoneNumber } = body;
      const otpRecord = await this.prisma.user.findFirst({
        where: { phoneNumber, otp: parseInt(otp) },
      });
      if (!otpRecord) {
        return this.globalService.response('OTP Not Match!!', {}, 201);
      }
      await this.prisma.user.update({
        where: { id: otpRecord.id },
        data: {
          isVerifiedOTP: true,
          phoneVerifiedAt: new Date(),
        },
      });
      const payload = { sub: otpRecord.id, email: otpRecord.email };
      const expiresInDays = 1000;
      const token = this.jwt.sign(payload, {
        expiresIn: `${expiresInDays}d`,
      });
      const customerExists = await this.prisma.customer.findFirst({
        where: { userId: otpRecord.id, deletedAt: null },
      });
      if (customerExists) {
        await this.prisma.customer.delete({
          where: {
            userId: otpRecord.id,
          },
        });
      }
      const customer = await this.prisma.customer.create({
        data: {
          code: await this.globalService.generateCustomerCode(this.prisma),
          userId: otpRecord.id,
          address,
        },
      });
      return {
        code: 200,
        message: 'Successfully',
        token,
        data: customer,
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw new InternalServerErrorException('Failed to verify OTP');
    }
  }

  // Recovery Mode API
  async findAllRecovery(request: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'deletedAt',
      sortOrder = 'desc',
      userId,
    } = request ?? {};

    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;

    const userIdArray = Array.isArray(userId)
      ? userId
      : userId
      ? String(userId)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const whereConditions: any = {
      deletedAt: { not: null },
      ...(userIdArray ? { userId: { in: userIdArray } } : {}),
    };

    if (!isBlankish(search)) {
      const kw = String(search).trim();
      whereConditions.OR = [
        { code: { contains: kw, mode: 'insensitive' } },
        { nik: { contains: kw, mode: 'insensitive' } },
        { city: { contains: kw, mode: 'insensitive' } },
        { address: { contains: kw, mode: 'insensitive' } },
        { birthdayDate: { contains: kw, mode: 'insensitive' } },
        { emergencyNumber: { contains: kw, mode: 'insensitive' } },
        { user: { name: { contains: kw, mode: 'insensitive' } } },
        { user: { email: { contains: kw, mode: 'insensitive' } } },
        { user: { phoneNumber: { contains: kw, mode: 'insensitive' } } },
      ];
    }

    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'deletedAt',
      'code',
      'city',
      'birthdayDate',
    ]);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'deletedAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.customer.count({ where: whereConditions }),
        this.prisma.customer.findMany({
          where: whereConditions,
          include: { user: true },
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
        }),
      ]);

      return {
        code: 200,
        message: 'Successfully',
        data: Array.isArray(datas) ? datas : [],
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
          hasNextPage: pageNum < Math.ceil(total / take),
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          userId: userIdArray ?? 'ANY',
          search: isBlankish(search) ? '' : search,
          onlyDeleted: true,
        },
      };
    } catch (error) {
      console.error('Failed to list deleted customers:', error);
      throw new InternalServerErrorException(
        'Failed to list deleted customers',
      );
    }
  }

  async restore(id: string) {
    try {
      const result = await this.prisma.customer.updateMany({
        where: { id, NOT: { deletedAt: null } },
        data: { deletedAt: null },
      });

      if (result.count === 0) {
        throw new NotFoundException('Customer not found or not soft-deleted');
      }

      const restored = await this.prisma.customer.findUnique({
        where: { id },
        include: { user: true },
      });

      return {
        code: 200,
        message: 'Successfully Restored',
        data: restored,
      };
    } catch (error) {
      console.error('Failed to restore customer:', error);
      throw new InternalServerErrorException('Failed to restore customer');
    }
  }

  async destroy(id: string) {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id, NOT: { deletedAt: null } },
        select: { id: true, userId: true },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found or not soft-deleted');
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.customerBank.deleteMany({ where: { customerId: id } });
        await tx.customerPassenger.deleteMany({ where: { customerId: id } });
        await tx.invoice.deleteMany({ where: { customerId: id } });
        await tx.order.deleteMany({ where: { customerId: id } });
        await tx.testimonial.deleteMany({ where: { customerId: id } });
        await tx.subscriptionOrder.deleteMany({ where: { customerId: id } });
        const res = await tx.customer.deleteMany({
          where: { id, NOT: { deletedAt: null } },
        });
        if (res.count === 0) {
          throw new NotFoundException('Customer not found or not soft-deleted');
        }
        await tx.user.delete({
          where: { id: customer.userId },
        });

        return res;
      });

      return {
        code: 200,
        message: 'Successfully destroyed',
        data: { id, userId: customer.userId, hardDeleted: true },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot hard delete: related records still reference this entity. Clean up related data first.',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Record already removed');
        }
      }
      console.error('Failed to hard delete customer & user:', error);
      throw new InternalServerErrorException(
        'Failed to hard delete customer & user',
      );
    }
  }

  async generateGoogleAuthUrl(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      select: { googleId: true, syncWithGoogleCalendar: true },
    });

    if (!user || !user.googleId) {
      throw new UnauthorizedException('User not found or no Google ID');
    }

    const oauth2Client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });

    const state = Buffer.from(
      JSON.stringify({ email, googleId: user.googleId }),
    ).toString('base64');

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
      state,
    });

    return { authUrl };
  }

  async createGoogleCalendarEvent(email: string, body: any) {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
        throw new BadRequestException('Email tidak valid.');
      }

      if (!body || typeof body !== 'object') {
        throw new BadRequestException('Body request tidak valid.');
      }

      if (
        body.orderId &&
        (typeof body.orderId !== 'string' || body.orderId.trim() === '')
      ) {
        throw new BadRequestException('orderId tidak valid.');
      }

      const result = await this.globalService.createGoogleCalendarEvent(
        email,
        body,
      );

      if (result.createdEvent && body.orderId) {
        await this.prisma.order.update({
          where: { id: body.orderId },
          data: { hasCalendarEvent: true, calendarProvider: 'GOOGLE' },
        });
      }

      return {
        success: true,
        message: 'Event berhasil ditambahkan ke Google Calendar.',
        data: result.createdEvent,
      };
    } catch (error) {
      console.error('Error di CustomerService.createGoogleCalendarEvent:', {
        message: error.message,
        code: error.code || 'UNKNOWN',
        details: error.errors || null,
        stack: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Gagal membuat event Google Calendar: ${
          error.message || 'Terjadi kesalahan.'
        }`,
      );
    }
  }
}
