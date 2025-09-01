import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import {
  AudienceScope,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@prisma/client';

interface FindAllRequest {
  page?: string | number;
  limit?: string | number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  userId?: string;
  lang?: string;
  status?: string;
  scope?: string;
  channels?: string | string[];
  subjectType?: string;
  subjectId?: string;
  isRead?: string | boolean;
  archived?: string | boolean;
  muted?: string | boolean;
  dateFrom?: string;
  dateTo?: string;
  sendFrom?: string;
  sendTo?: string;
}

interface NotificationResponse {
  id: string;
  subjectType: string | null;
  status: NotificationStatus;
  scope: AudienceScope;
  channels: NotificationChannel[];
  sendAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  message?: string;
  translations?: {
    id_ID: { title: string; message: string };
    en_US: { title: string; message: string };
  };
  recipients: {
    id: string;
    userId: string;
    readAt: Date | null;
    archivedAt: Date | null;
    muted: boolean;
    createdAt: Date;
    deliveries: {
      id: string;
      channel: NotificationChannel;
      status: string;
      provider: string | null;
      toAddress: string | null;
      sentAt: Date | null;
      deliveredAt: Date | null;
      readAt: Date | null;
    }[];
  }[];
}

interface Response {
  code: number;
  message: string;
  data: NotificationResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  sort: { sortBy: string; sortOrder: string };
  filters: any;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  async findAll(request: FindAllRequest): Promise<Response> {
    try {
      const isBlank = (value: any): boolean =>
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '');

      const toArray = <T = string>(value: any): T[] => {
        if (Array.isArray(value))
          return value.filter((v) => !isBlank(v)) as T[];
        if (isBlank(value)) return [];
        return [value] as T[];
      };

      const parseBoolean = (value: any): boolean | undefined => {
        if (isBlank(value)) return undefined;
        const str = String(value).toLowerCase();
        return str === 'true' ? true : str === 'false' ? false : undefined;
      };

      const isValidDate = (dateStr: any): boolean => {
        if (isBlank(dateStr)) return false;
        const date = new Date(String(dateStr));
        return !isNaN(date.getTime());
      };

      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        userId,
        lang = 'multiple',
        status,
        scope,
        channels,
        subjectType,
        subjectId,
        isRead,
        archived,
        muted,
        dateFrom,
        dateTo,
        sendFrom,
        sendTo,
      } = request ?? {};

      const pageNum = Math.max(Number(page) || 1, 1);
      const take = Math.max(Number(limit) || 10, 1);
      const skip = (pageNum - 1) * take;
      const allowedSortFields = new Set([
        'createdAt',
        'updatedAt',
        'sendAt',
        'status',
        'subjectType',
      ]);
      const _sortBy = allowedSortFields.has(String(sortBy))
        ? String(sortBy)
        : 'createdAt';
      const _sortOrder =
        String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

      const channelsArr = toArray<string>(channels);
      const wantRead = parseBoolean(isRead);
      const wantArchived = parseBoolean(archived);
      const wantMuted = parseBoolean(muted);
      const wantMultipleLang = String(lang).toLowerCase() === 'multiple';
      const targetLang = wantMultipleLang ? 'multiple' : String(lang);

      const createdAtRange: { gte?: Date; lte?: Date } = {};
      if (isValidDate(dateFrom))
        createdAtRange.gte = new Date(String(dateFrom));
      if (isValidDate(dateTo)) createdAtRange.lte = new Date(String(dateTo));
      const sendAtRange: { gte?: Date; lte?: Date } = {};
      if (isValidDate(sendFrom)) sendAtRange.gte = new Date(String(sendFrom));
      if (isValidDate(sendTo)) sendAtRange.lte = new Date(String(sendTo));
      const recipientSubWhere: Prisma.NotificationRecipientWhereInput = {
        userId: userId ? String(userId) : undefined,
        ...(wantRead !== undefined
          ? { readAt: wantRead ? { not: null } : null }
          : {}),
        ...(wantArchived !== undefined
          ? { archivedAt: wantArchived ? { not: null } : null }
          : {}),
        ...(wantMuted !== undefined ? { muted: wantMuted } : {}),
      };

      const where: Prisma.NotificationsWhereInput = {
        AND: [
          { deletedAt: null },
          userId ? { recipients: { some: recipientSubWhere } } : {},
          status && !isBlank(status)
            ? { status: status as NotificationStatus }
            : {},
          scope && !isBlank(scope) ? { scope: scope as AudienceScope } : {},
          subjectType && !isBlank(subjectType)
            ? {
                subjectType: {
                  contains: String(subjectType),
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              }
            : {},
          subjectId && !isBlank(subjectId)
            ? { subjectId: String(subjectId) }
            : {},
          Object.keys(createdAtRange).length > 0
            ? { createdAt: createdAtRange }
            : {},
          Object.keys(sendAtRange).length > 0 ? { sendAt: sendAtRange } : {},
          channelsArr.length > 0
            ? { channels: { hasSome: channelsArr as NotificationChannel[] } }
            : {},
          search && !isBlank(search)
            ? {
                OR: [
                  {
                    subjectType: {
                      contains: String(search).trim(),
                      mode: 'insensitive' as Prisma.QueryMode,
                    },
                  },
                  {
                    entity: {
                      translations: {
                        some: {
                          field: { in: ['title', 'message'] },
                          translation: {
                            contains: String(search).trim(),
                            mode: 'insensitive' as Prisma.QueryMode,
                          },
                          ...(wantMultipleLang
                            ? {}
                            : { language: { code: targetLang } }),
                        },
                      },
                    },
                  },
                ],
              }
            : {},
        ].filter(
          (condition) => Object.keys(condition).length > 0,
        ) as Prisma.NotificationsWhereInput[],
      };

      const [total, rows] = await this.prisma.$transaction([
        this.prisma.notifications.count({ where }),
        this.prisma.notifications.findMany({
          where,
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
          include: {
            recipients: {
              where: userId ? { userId: String(userId) } : {},
              select: {
                id: true,
                userId: true,
                readAt: true,
                archivedAt: true,
                muted: true,
                createdAt: true,
                deliveries: {
                  select: {
                    id: true,
                    channel: true,
                    status: true,
                    provider: true,
                    toAddress: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
            entity: {
              include: {
                translations: {
                  where: {
                    field: { in: ['title', 'message'] },
                    ...(wantMultipleLang
                      ? {}
                      : { language: { code: targetLang } }),
                  },
                  select: {
                    id: true,
                    field: true,
                    translation: true,
                    language: { select: { code: true } },
                  },
                },
              },
            },
          },
        }),
      ]);

      const data = rows.map((row) => {
        const translations = row.entity.translations;
        if (wantMultipleLang) {
          const formattedTranslations = {
            id_ID: {
              title:
                translations.find(
                  (t) => t.language.code === 'id_ID' && t.field === 'title',
                )?.translation ?? '',
              message:
                translations.find(
                  (t) => t.language.code === 'id_ID' && t.field === 'message',
                )?.translation ?? '',
            },
            en_US: {
              title:
                translations.find(
                  (t) => t.language.code === 'en_US' && t.field === 'title',
                )?.translation ?? '',
              message:
                translations.find(
                  (t) => t.language.code === 'en_US' && t.field === 'message',
                )?.translation ?? '',
            },
          };

          return {
            id: row.id,
            subjectType: row.subjectType,
            status: row.status,
            scope: row.scope,
            channels: row.channels,
            sendAt: row.sendAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            translations: formattedTranslations,
            recipients: row.recipients,
          };
        }

        const title =
          translations.find(
            (t) => t.language.code === targetLang && t.field === 'title',
          )?.translation ?? '';
        const message =
          translations.find(
            (t) => t.language.code === targetLang && t.field === 'message',
          )?.translation ?? '';

        return {
          id: row.id,
          subjectType: row.subjectType,
          status: row.status,
          scope: row.scope,
          channels: row.channels,
          sendAt: row.sendAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          title,
          message,
          recipients: row.recipients,
        };
      });

      const totalPages = Math.max(Math.ceil(total / take), 1);
      return {
        code: 200,
        message: 'Success',
        data,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          search: isBlank(search) ? '' : String(search),
          lang: wantMultipleLang ? ['multiple'] : [targetLang],
          userId: isBlank(userId) ? '' : String(userId),
          status: isBlank(status) ? '' : String(status),
          scope: isBlank(scope) ? '' : String(scope),
          channels: channelsArr,
          subjectType: isBlank(subjectType) ? '' : String(subjectType),
          subjectId: isBlank(subjectId) ? '' : String(subjectId),
          isRead: wantRead,
          archived: wantArchived,
          muted: wantMuted,
          dateFrom: isBlank(dateFrom) ? '' : String(dateFrom),
          dateTo: isBlank(dateTo) ? '' : String(dateTo),
          sendFrom: isBlank(sendFrom) ? '' : String(sendFrom),
          sendTo: isBlank(sendTo) ? '' : String(sendTo),
        },
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async findOne(
    id: string,
    languageCode: string = 'multiple',
    userId?: string,
  ) {
    try {
      const wantMultiple = (languageCode ?? 'multiple') === 'multiple';
      const singleLangCode = wantMultiple ? undefined : languageCode;
      const recipientsWhere = userId ? { userId } : undefined;
      const translationsWhere = wantMultiple
        ? { field: { in: ['title', 'message'] } }
        : {
            field: { in: ['title', 'message'] },
            language: { code: singleLangCode! },
          };

      return await this.prisma.$transaction(async (prisma) => {
        const data = await prisma.notifications.findFirst({
          where: { id, deletedAt: null },
          include: {
            audienceRoles: { select: { id: true, role: true } },
            audienceUsers: { select: { id: true, userId: true } },
            recipients: {
              ...(recipientsWhere ? { where: recipientsWhere } : {}),
              select: {
                id: true,
                userId: true,
                readAt: true,
                archivedAt: true,
                muted: true,
                createdAt: true,
                deliveries: {
                  select: {
                    id: true,
                    channel: true,
                    status: true,
                    provider: true,
                    toAddress: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
            entity: {
              include: {
                translations: {
                  where: translationsWhere,
                  select: {
                    id: true,
                    field: true,
                    translation: true,
                    language: { select: { code: true } },
                  },
                },
              },
            },
          },
        });

        if (!data) {
          return this.globalService.response('Data Not Found!', {});
        }
        let updatedRecipients = data.recipients;
        if (userId) {
          const recipient = await prisma.notificationRecipient.findUnique({
            where: {
              notificationId_userId: { notificationId: id, userId },
            },
          });

          if (recipient && !recipient.readAt) {
            await prisma.notificationRecipient.update({
              where: {
                notificationId_userId: { notificationId: id, userId },
              },
              data: {
                readAt: new Date(),
              },
            });

            await prisma.notificationDelivery.updateMany({
              where: {
                recipientId: recipient.id,
                status: { in: ['PENDING', 'SENDING', 'SENT'] },
              },
              data: {
                status: 'READ',
                readAt: new Date(),
              },
            });

            const allRecipients = await prisma.notificationRecipient.count({
              where: { notificationId: id },
            });
            const readRecipients = await prisma.notificationRecipient.count({
              where: { notificationId: id, readAt: { not: null } },
            });

            if (allRecipients === readRecipients) {
              await prisma.notifications.update({
                where: { id },
                data: { status: 'SENT' },
              });
              data.status = 'SENT';
            }

            updatedRecipients = await prisma.notificationRecipient.findMany({
              where: recipientsWhere
                ? { ...recipientsWhere, notificationId: id }
                : { notificationId: id },
              select: {
                id: true,
                userId: true,
                readAt: true,
                archivedAt: true,
                muted: true,
                createdAt: true,
                deliveries: {
                  select: {
                    id: true,
                    channel: true,
                    status: true,
                    provider: true,
                    toAddress: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            });
          }
        }

        let transformedData: any = { ...data, recipients: updatedRecipients };

        if (data.entity?.translations) {
          if (wantMultiple) {
            const translationsObj: {
              [key: string]: { title?: string; message?: string };
            } = {};
            data.entity.translations.forEach((t) => {
              const langCode = t.language.code;
              if (!translationsObj[langCode]) {
                translationsObj[langCode] = {};
              }
              if (t.field === 'title') {
                translationsObj[langCode].title = t.translation;
              } else if (t.field === 'message') {
                translationsObj[langCode].message = t.translation;
              }
            });
            transformedData = {
              translations: translationsObj,
              ...transformedData,
            };
          } else {
            const titleTranslation = data.entity.translations.find(
              (t) => t.field === 'title' && t.language.code === singleLangCode,
            );
            const messageTranslation = data.entity.translations.find(
              (t) =>
                t.field === 'message' && t.language.code === singleLangCode,
            );
            transformedData = {
              title: titleTranslation?.translation || '',
              message: messageTranslation?.translation || '',
              ...transformedData,
            };
          }
        }

        return this.globalService.response('Successfully', transformedData);
      });
    } catch (error) {
      console.error('Something Wrong:', error);
      return this.globalService.response('Error', {});
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.notifications.findUnique({
        where: { id, deletedAt: null },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      const data = await this.prisma.notifications.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully', data);
    } catch (error) {
      console.error('Something Wrong :', error);
      return this.globalService.response('Successfully', {});
    }
  }

  // Recovery Mode API
  async findAllRecovery(request: any) {
    try {
      const isBlankish = (v: any) =>
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '');
      const toArray = <T = string>(v: any): T[] => {
        if (Array.isArray(v)) return v.filter((x) => !isBlankish(x)) as T[];
        if (isBlankish(v)) return [];
        return [v] as T[];
      };
      const bool = (v: any): boolean | undefined => {
        if (v === undefined || v === null || v === '') return undefined;
        const s = String(v).toLowerCase();
        if (s === 'true') return true;
        if (s === 'false') return false;
        return undefined;
      };
      const isValidDate = (dateStr: any): boolean => {
        if (isBlankish(dateStr)) return false;
        const date = new Date(String(dateStr));
        return !isNaN(date.getTime());
      };

      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        userId,
        lang = 'multiple',
        status,
        scope,
        channels,
        subjectType,
        subjectId,
        isRead,
        archived,
        muted,
        dateFrom,
        dateTo,
        sendFrom,
        sendTo,
      } = request ?? {};

      const pageNum = Math.max(Number(page) || 1, 1);
      const take = Math.max(Number(limit) || 10, 1);
      const skip = (pageNum - 1) * take;
      const allowedSort = new Set([
        'createdAt',
        'updatedAt',
        'sendAt',
        'status',
        'subjectType',
      ]);
      const _sortBy = allowedSort.has(String(sortBy))
        ? String(sortBy)
        : 'createdAt';
      const _sortOrder =
        String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

      const channelsArr = toArray<string>(channels);
      const wantRead = bool(isRead);
      const wantArchived = bool(archived);
      const wantMuted = bool(muted);
      const wantMultiple = String(lang).toLowerCase() === 'multiple';
      const targetLang = wantMultiple ? 'multiple' : String(lang);

      const createdAtRange: any = {};
      if (isValidDate(dateFrom))
        createdAtRange.gte = new Date(String(dateFrom));
      if (isValidDate(dateTo)) createdAtRange.lte = new Date(String(dateTo));
      const sendAtRange: any = {};
      if (isValidDate(sendFrom)) sendAtRange.gte = new Date(String(sendFrom));
      if (isValidDate(sendTo)) sendAtRange.lte = new Date(String(sendTo));

      const recipientSubWhere: Prisma.NotificationRecipientWhereInput = {
        userId: String(userId),
        ...(wantRead === undefined
          ? {}
          : wantRead
          ? { readAt: { not: null } }
          : { readAt: null }),
        ...(wantArchived === undefined
          ? {}
          : wantArchived
          ? { archivedAt: { not: null } }
          : { archivedAt: null }),
        ...(wantMuted === undefined ? {} : { muted: wantMuted }),
      };
      const AND: Prisma.NotificationsWhereInput[] = [
        { deletedAt: { not: null } },
        { recipients: { some: recipientSubWhere } },
      ];
      if (!isBlankish(status)) AND.push({ status: String(status) as any });
      if (!isBlankish(scope)) AND.push({ scope: String(scope) as any });
      if (!isBlankish(subjectType))
        AND.push({
          subjectType: { contains: String(subjectType), mode: 'insensitive' },
        });
      if (!isBlankish(subjectId)) AND.push({ subjectId: String(subjectId) });
      if (Object.keys(createdAtRange).length > 0)
        AND.push({ createdAt: createdAtRange });
      if (Object.keys(sendAtRange).length > 0)
        AND.push({ sendAt: sendAtRange });
      if (channelsArr.length > 0)
        AND.push({ channels: { hasSome: channelsArr as any } });
      if (!isBlankish(search)) {
        const s = String(search).trim();
        const translationFilter: any = {
          ...(wantMultiple ? {} : { language: { code: targetLang } }),
          field: { in: ['title', 'message'] },
          translation: { contains: s, mode: 'insensitive' },
        };
        AND.push({
          OR: [
            { subjectType: { contains: s, mode: 'insensitive' } },
            { entity: { translations: { some: translationFilter } } },
          ],
        });
      }
      const where: Prisma.NotificationsWhereInput = { AND };
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.notifications.count({ where }),
        this.prisma.notifications.findMany({
          where,
          orderBy: { [_sortBy]: _sortOrder as Prisma.SortOrder },
          skip,
          take,
          include: {
            audienceRoles: {
              select: {
                id: true,
                role: true,
              },
            },
            audienceUsers: {
              select: {
                id: true,
                userId: true,
              },
            },
            recipients: {
              where: { userId: String(userId) },
              select: {
                id: true,
                userId: true,
                readAt: true,
                archivedAt: true,
                muted: true,
                createdAt: true,
                deliveries: {
                  select: {
                    id: true,
                    channel: true,
                    status: true,
                    provider: true,
                    toAddress: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
            entity: {
              include: {
                translations: wantMultiple
                  ? {
                      where: { field: { in: ['title', 'message'] } },
                      select: {
                        id: true,
                        field: true,
                        translation: true,
                        language: { select: { code: true } },
                      },
                    }
                  : {
                      where: {
                        language: { code: targetLang },
                        field: { in: ['title', 'message'] },
                      },
                      select: {
                        id: true,
                        field: true,
                        translation: true,
                        language: { select: { code: true } },
                      },
                    },
              },
            },
          },
        }),
      ]);

      const totalPages = Math.max(Math.ceil(total / take), 1);

      return {
        code: 200,
        message: 'Successfully',
        data: datas ?? [],
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          search: isBlankish(search) ? '' : String(search),
          lang: wantMultiple ? ['multiple'] : [targetLang],
          userId: userId ? String(userId) : '',
          status: isBlankish(status) ? '' : String(status),
          scope: isBlankish(scope) ? '' : String(scope),
          channels: channelsArr,
          subjectType: isBlankish(subjectType) ? '' : String(subjectType),
          subjectId: isBlankish(subjectId) ? '' : String(subjectId),
          isRead: wantRead,
          archived: wantArchived,
          muted: wantMuted,
          dateFrom: isBlankish(dateFrom) ? '' : String(dateFrom),
          dateTo: isBlankish(dateTo) ? '' : String(dateTo),
          sendFrom: isBlankish(sendFrom) ? '' : String(sendFrom),
          sendTo: isBlankish(sendTo) ? '' : String(sendTo),
        },
      };
    } catch (error) {
      console.error('Something Wrong :', error);
      return {
        code: 200,
        message: 'Successfully',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        sort: { sortBy: 'createdAt', sortOrder: 'desc' },
        filters: {
          search: '',
          lang: ['multiple'],
          userId: '',
          status: '',
          scope: '',
          channels: [],
          subjectType: '',
          subjectId: '',
          isRead: undefined,
          archived: undefined,
          muted: undefined,
          dateFrom: '',
          dateTo: '',
          sendFrom: '',
          sendTo: '',
        },
      };
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.notifications.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.notifications.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async destroy(id: string) {
    try {
      const validate = await this.prisma.notifications.findUnique({
        where: { id, deletedAt: null },
      });

      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      await this.prisma.$transaction([
        this.prisma.notificationAudienceRole.deleteMany({
          where: { notificationId: id },
        }),
        this.prisma.notificationAudienceUser.deleteMany({
          where: { notificationId: id },
        }),
        this.prisma.notificationRecipient.deleteMany({
          where: { notificationId: id },
        }),
        this.prisma.notifications.delete({
          where: { id },
        }),
      ]);
      return this.globalService.response('Successfully', {});
    } catch (error) {
      console.error('Something Wrong :', error);
      return this.globalService.response('Successfully', {});
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    try {
      const recipient = await this.prisma.notificationRecipient.findUnique({
        where: {
          notificationId_userId: { notificationId, userId },
        },
      });

      if (!recipient) {
        return {
          code: 404,
          message: 'Recipient not found for this notification',
        };
      }

      if (recipient.readAt) {
        return { code: 400, message: 'Notification already marked as read' };
      }

      await this.prisma.$transaction(async (prisma) => {
        await prisma.notificationRecipient.update({
          where: {
            notificationId_userId: { notificationId, userId },
          },
          data: {
            readAt: new Date(),
          },
        });

        await prisma.notificationDelivery.updateMany({
          where: {
            recipientId: recipient.id,
            status: { in: ['PENDING', 'SENDING', 'SENT'] },
          },
          data: {
            status: 'READ',
            readAt: new Date(),
          },
        });

        const allRecipients = await prisma.notificationRecipient.count({
          where: { notificationId },
        });
        const readRecipients = await prisma.notificationRecipient.count({
          where: { notificationId, readAt: { not: null } },
        });

        if (allRecipients === readRecipients) {
          await prisma.notifications.update({
            where: { id: notificationId },
            data: { status: 'SENT' },
          });
        }
      });

      return {
        code: 200,
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { code: 500, message: 'Failed to mark notification as read' };
    }
  }

  async bulkMarkAsRead(
    notificationIds: string[],
    userId: string,
  ): Promise<any> {
    try {
      if (!notificationIds || notificationIds.length === 0) {
        return { code: 400, message: 'No notification IDs provided' };
      }
      const recipients = await this.prisma.notificationRecipient.findMany({
        where: {
          notificationId: { in: notificationIds },
          userId,
          readAt: null,
        },
        select: {
          id: true,
          notificationId: true,
        },
      });
      if (recipients.length === 0) {
        return {
          code: 404,
          message: 'No unread notifications found for this user',
        };
      }
      const recipientIds = recipients.map((r) => r.id);
      const markedNotificationIds = recipients.map((r) => r.notificationId);
      await this.prisma.$transaction(async (prisma) => {
        await prisma.notificationRecipient.updateMany({
          where: {
            id: { in: recipientIds },
          },
          data: {
            readAt: new Date(),
          },
        });
        await prisma.notificationDelivery.updateMany({
          where: {
            recipientId: { in: recipientIds },
            status: { in: ['PENDING', 'SENDING', 'SENT'] },
          },
          data: {
            status: 'READ',
            readAt: new Date(),
          },
        });
        for (const notificationId of markedNotificationIds) {
          const allRecipients = await prisma.notificationRecipient.count({
            where: { notificationId },
          });
          const readRecipients = await prisma.notificationRecipient.count({
            where: { notificationId, readAt: { not: null } },
          });
          if (allRecipients === readRecipients) {
            await prisma.notifications.update({
              where: { id: notificationId },
              data: { status: 'SENT' },
            });
          }
        }
      });
      return {
        code: 200,
        message: `Successfully marked ${recipients.length} notifications as read`,
        markedCount: recipients.length,
      };
    } catch (error: any) {
      console.error('Error in bulkMarkAsRead:', error);
      return { code: 500, message: 'Failed to mark notifications as read' };
    }
  }

  async countNotifications(
    userId: string,
    notificationId?: string,
  ): Promise<any> {
    try {
      const whereClause = notificationId
        ? { userId, notificationId }
        : { userId };
      const readCount = await this.prisma.notificationRecipient.count({
        where: {
          ...whereClause,
          readAt: { not: null },
        },
      });
      const unreadCount = await this.prisma.notificationRecipient.count({
        where: {
          ...whereClause,
          readAt: null,
        },
      });
      return this.globalService.response('Successfully', {
        read: readCount,
        unread: unreadCount,
        total: readCount + unreadCount,
      });
    } catch (error) {
      console.error('Error counting notifications:', error);
      return this.globalService.response('Error', {});
    }
  }
}
