/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */ /* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import { S3 } from 'aws-sdk';
import axios from 'axios';
import UploadResponse from './s3.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import slugify from 'slugify';
import * as fs from 'fs-extra';
import {
  AudienceScope,
  DeliveryStatus,
  NotificationChannel,
  NotificationStatus,
} from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { calendar, calendar_v3 } from '@googleapis/calendar';
import { CreateGoogleDto } from 'src/google/dto/create-google.dto';

@Injectable()
export class GlobalService {
  private transporter;
  private s3: AWS.S3;
  private AWS_S3_BUCKET: string;

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3({
      region: this.configService.get<string>('AWS_REGION'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    });
    this.AWS_S3_BUCKET = this.configService.get<string>('AWS_S3_BUCKET_NAME');
  }

  async response(message: string, datas: object, extra?: any) {
    let response: object = {
      code: 200,
      message: message,
      data: datas,
    };
    if (!datas) {
      response = {
        code: 204,
        message: message,
        data: datas,
      };
    }

    if (extra?.pagination) {
      response = {
        ...response,
        pagination: extra.pagination,
      };
    }

    if (extra?.info) {
      response = {
        ...response,
        info: extra.info,
      };
    }

    return response;
  }

  async formatDateToIndonesianLong(date: string) {
    const yourDate = new Date(date);
    const formattedDate = format(yourDate, 'eeee, dd MMMM yyyy', {
      locale: id,
    });
    return formattedDate;
  }

  async sendMail(
    to: string,
    subject: string,
    templateName: string,
    data: object,
  ) {
    const templatePath = path.join(
      __dirname,
      '../../../src/global/templates',
      `${templateName}.ejs`,
    );
    console.log('Template Path:', templatePath);
    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
      from: 'noreply@menuku.app',
      to,
      subject,
      html,
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error: any, info: unknown) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  }

  async uploadFile(file: any) {
    const uniqueName = await this.makeid(20);
    const mimetype = file.fileType
      ? file.fileType.mime
      : 'application/octet-stream';
    console.log(file);
    const s3Response = await this.s3_upload(
      file.buffer,
      this.AWS_S3_BUCKET,
      uniqueName + '.' + file.fileType.ext,
      mimetype,
    );
    return s3Response;
  }

  async deleteFileS3(fileKey: string) {
    try {
      const spacesEndpoint = new AWS.Endpoint(
        this.configService.get<string>('AWS_S3_ENDPOINT') || 'https://is3.cloudhost.id'
      );
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      });
      const params = {
        Bucket: this.configService.get<string>('AWS_S3_DELETE_BUCKET') || 'himovy-stg',
        Key: fileKey,
      };
      const s3DeleteResponse = await s3.deleteObject(params).promise();
      return {
        success: true,
        message: 'File deleted successfully',
        data: s3DeleteResponse,
      };
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      return {
        success: false,
        message: 'Failed to delete file',
        error,
      };
    }
  }

  async uploadFileBase64(filePath: string) {
    try {
      const buffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath);
      const uniqueName = await this.makeid(20);
      let mimetype;
      if (fileExtension === '.png') {
        mimetype = 'image/png';
      } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        mimetype = 'image/jpeg';
      } else {
        mimetype = 'application/octet-stream';
      }
      const s3Response = await this.s3_upload(
        buffer,
        this.AWS_S3_BUCKET,
        `${uniqueName}${fileExtension}`,
        mimetype,
      );
      return s3Response;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(filePath: string) {
    try {
      const fileExists = await fs.pathExists(filePath);
      if (fileExists) {
        await fs.unlink(filePath);
      } else {
        throw new Error(`File not found at ${filePath}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async makeid(length) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  async s3_upload(
    file: any,
    bucket: string,
    name: any,
    mimetype: any,
  ): Promise<UploadResponse> {
    const spacesEndpoint = new AWS.Endpoint('https://is3.cloudhost.id');
    const s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: 'WXCIMRU1JRDWZ72TIRQ2',
      secretAccessKey: 'CCAxyBrvq7UTCzCPmBJdBzKjFcCOLstG7iGBGhJe',
    });
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const folderPath = `${formattedDate}/`;
    const uploadParams = {
      Bucket: 'himovy-stg',
      Key: folderPath + String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
    };
    const result = await s3.upload(uploadParams).promise();
    return result;
  }

  async whatsappQisqus(data: any, customHeaders: any) {
    const appId = process.env.QISQUS_APP_ID;
    const channelId = process.env.QISQUS_APP_CHANNEL_ID;
    const url = `https://multichannel.qiscus.com/whatsapp/v1/${appId}/${channelId}/messages`;
    const config = {
      headers: customHeaders,
    };
    try {
      const response = await axios.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(
        'Qiscus WhatsApp Error:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
  slugable(text: string) {
    return slugify(text, {
      lower: true,
      trim: true,
      strict: true,
    });
  }

  async encryptSaldo(saldo: any) {
    const CryptoJS = require('crypto-js');

    // Encrypt
    const ciphertext = CryptoJS.AES.encrypt(
      saldo,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YjNjMjUyOS1iN2YzLTQyMDEtOTMwOC0wMzc5MTJlYmNlNzgiLCJlbWFpbCI6InVkaW5AZ21haWwuY29tIiwiaWF0IjoxNjk3MTkyNzEwLCJleHAiOjE2OTcxOTYzMTB9',
    ).toString();
    return ciphertext;
  }

  async decryptSaldo(saldo: any) {
    if (saldo != '0') {
      const CryptoJS = require('crypto-js');

      // Decrypt
      const bytes = CryptoJS.AES.decrypt(
        saldo,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YjNjMjUyOS1iN2YzLTQyMDEtOTMwOC0wMzc5MTJlYmNlNzgiLCJlbWFpbCI6InVkaW5AZ21haWwuY29tIiwiaWF0IjoxNjk3MTkyNzEwLCJleHAiOjE2OTcxOTYzMTB9',
      );
      const originalText = bytes.toString(CryptoJS.enc.Utf8);

      return originalText;
    } else {
      return saldo;
    }
  }

  async encrypt(code: any) {
    const CryptoJS = require('crypto-js');

    // Encrypt
    const ciphertext = CryptoJS.AES.encrypt(
      code,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YjNjMjUyOS1iN2YzLTQyMDEtOTMwOC0wMzc5MTJlYmNlNzgiLCJlbWFpbCI6InVkaW5AZ21haWwuY29tIiwiaWF0IjoxNjk3MTkyNzEwLCJleHAiOjE2OTcxOTYzMTB9',
    ).toString();
    return ciphertext;
  }

  async decrypt(code: any) {
    if (code != '0') {
      const CryptoJS = require('crypto-js');

      // Decrypt
      const bytes = CryptoJS.AES.decrypt(
        code,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YjNjMjUyOS1iN2YzLTQyMDEtOTMwOC0wMzc5MTJlYmNlNzgiLCJlbWFpbCI6InVkaW5AZ21haWwuY29tIiwiaWF0IjoxNjk3MTkyNzEwLCJleHAiOjE2OTcxOTYzMTB9',
      );
      const originalText = bytes.toString(CryptoJS.enc.Utf8);

      return originalText;
    } else {
      return code;
    }
  }

  async generateOrderItemCode(prisma: PrismaService): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let code = '';
    let isUnique = false;
    while (!isUnique) {
      code = Array.from(
        { length: 10 },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join('');
      const existing = await prisma.orderItem.findFirst({ where: { code } });
      isUnique = !existing;
    }
    return code;
  }

  async generateOrderCode(prisma: PrismaService): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentDate = `${month}${year}`;
    const prefix = `CR-${currentDate}`;
    const lastOrder = await prisma.order.findFirst({
      where: { code: { startsWith: 'CR-' } },
      orderBy: { code: 'desc' },
    });
    let lastSeq = 0;
    if (lastOrder && lastOrder.code) {
      // Ambil tahun dari code terakhir
      const lastYear = lastOrder.code.substring(5, 7); // CR-MMYYxxxxxx
      if (lastYear === year) {
        const seqStr = lastOrder.code.slice(prefix.length);
        lastSeq = parseInt(seqStr, 10) || 0;
      } else {
        lastSeq = 0;
      }
    }
    const sequenceNumber = (lastSeq + 1).toString().padStart(6, '0');
    return `${prefix}${sequenceNumber}`.toUpperCase();
  }

  async generateInvoiceCode(prisma: PrismaService): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentDate = `${month}${year}`;
    const prefix = `IN-${currentDate}`;
    const lastInvoice = await prisma.invoice.findFirst({
      where: { code: { startsWith: 'IN-' } },
      orderBy: { code: 'desc' },
    });
    let lastSeq = 0;
    if (lastInvoice && lastInvoice.code) {
      const lastYear = lastInvoice.code.substring(5, 7);
      console.log(lastYear);
      if (lastYear === year) {
        const seqStr = lastInvoice.code.slice(prefix.length);
        lastSeq = parseInt(seqStr, 10) || 0;
      } else {
        lastSeq = 0;
      }
    }
    const sequenceNumber = (lastSeq + 1).toString().padStart(6, '0');
    return `${prefix}${sequenceNumber}`.toUpperCase();
  }

  async generateCustomerCode(prisma: PrismaService): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentDate = `${month}${year}`;
    const prefix = `CU-${currentDate}`;
    const lastCustomer = await prisma.customer.findFirst({
      where: { code: { startsWith: 'CU-' } },
      orderBy: { code: 'desc' },
    });
    let lastSeq = 0;
    if (lastCustomer && lastCustomer.code) {
      const lastYear = lastCustomer.code.substring(5, 7);
      if (lastYear === year) {
        const seqStr = lastCustomer.code.slice(prefix.length);
        lastSeq = parseInt(seqStr, 10) || 0;
      } else {
        lastSeq = 0;
      }
    }
    const sequenceNumber = (lastSeq + 1).toString().padStart(5, '0');
    return `${prefix}${sequenceNumber}`.toUpperCase();
  }

  async generateTripCode(prisma: PrismaService): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentDate = `${month}${year}`;
    const prefix = `TR-${currentDate}`;
    const lastTrip = await prisma.trips.findFirst({
      where: { code: { startsWith: 'TR-' } },
      orderBy: { code: 'desc' },
    });
    let lastSeq = 0;
    if (lastTrip && lastTrip.code) {
      const lastYear = lastTrip.code.substring(5, 7);
      if (lastYear === year) {
        const seqStr = lastTrip.code.slice(prefix.length);
        lastSeq = parseInt(seqStr, 10) || 0;
      } else {
        lastSeq = 0;
      }
    }
    const sequenceNumber = (lastSeq + 1).toString().padStart(6, '0');
    return `${prefix}${sequenceNumber}`.toUpperCase();
  }

  async generateSPJCode(prisma: PrismaService): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentDate = `${month}${year}`;
    const prefix = `SPJ-${currentDate}`;
    const lastTrip = await prisma.trips.findFirst({
      where: { codeSPJ: { startsWith: 'SPJ-' } },
      orderBy: { codeSPJ: 'desc' },
    });
    let lastSeq = 0;
    if (lastTrip && lastTrip.codeSPJ) {
      const lastYear = lastTrip.codeSPJ.substring(5, 7);
      if (lastYear === year) {
        const seqStr = lastTrip.codeSPJ.slice(prefix.length);
        lastSeq = parseInt(seqStr, 10) || 0;
      } else {
        lastSeq = 0;
      }
    }
    const sequenceNumber = (lastSeq + 1).toString().padStart(6, '0');
    return `${prefix}${sequenceNumber}`.toUpperCase();
  }

  public isBlank(v: any): boolean {
    return (
      v === undefined ||
      v === null ||
      (typeof v === 'string' && v.trim() === '')
    );
  }

  /**
   * Handles search, filter, pagination, and allows custom where (including relations).
   * @param prisma PrismaService instance
   * @param model Prisma model
   * @param request Request object (query/body)
   * @param searchFields Fields to search (OR, contains)
   * @param filterFields Fields to filter (AND, contains)
   * @param allowedSort Set of allowed sort fields
   * @param include Prisma include object
   * @param customWhere Additional Prisma where object (for advanced filtering, including relations)
   * @example
   *   // Example customWhere for relation:
   *   customWhere = { driverData: { status: 'IN_USE' } }
   */

  public async handleSearchAndFilter(
    prisma: PrismaService,
    model: any,
    request: any,
    searchFields: string[],
    filterFields: string[],
    allowedSort: Set<string>,
    include?: any,
    customWhere?: any,
  ) {
    const isBlank = this.isBlank.bind(this);
    const ic = (v: string) => ({ contains: v, mode: 'insensitive' as const });
    const req = request ?? {};
    const {
      page,
      limit,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...rest
    } = req;

    const AND: any[] = [{ deletedAt: null }];
    if (!isBlank(search) && searchFields.length > 0) {
      const s = String(search).trim();
      AND.push({
        OR: searchFields.map((field) => ({ [field]: ic(s) })),
      });
    }
    for (const field of filterFields) {
      if (!isBlank(rest[field])) {
        AND.push({ [field]: ic(String(rest[field])) });
      }
    }
    if (!isBlank(rest.createdFrom) || !isBlank(rest.createdTo)) {
      const createdAt: any = {};
      if (!isBlank(rest.createdFrom)) {
        createdAt.gte = new Date(String(rest.createdFrom));
      }
      if (!isBlank(rest.createdTo)) {
        createdAt.lte = new Date(String(rest.createdTo));
      }
      AND.push({ createdAt });
    }
    const where: any = { AND };
    if (customWhere && typeof customWhere === 'object') {
      if (customWhere.OR) {
        if (where.OR && Array.isArray(where.OR)) {
          where.OR = [...where.OR, ...[].concat(customWhere.OR)];
        } else {
          where.OR = [].concat(customWhere.OR);
        }
      }
    }
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'createdAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const filters: Record<string, string> = {};
    for (const field of [
      'search',
      ...filterFields,
      'createdFrom',
      'createdTo',
    ]) {
      filters[field] = isBlank(req[field]) ? '' : String(req[field]);
    }
    if (isBlank(page) && isBlank(limit)) {
      const datas = await model.findMany({
        where,
        orderBy: { [_sortBy]: _sortOrder },
        ...(include ? { include } : {}),
      });
      return {
        code: 200,
        message: 'Successfully',
        data: datas,
        pagination: null,
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters,
      };
    } else {
      const pageNum = Math.max(Number(page) || 1, 1);
      const take = Math.max(Number(limit) || 10, 1);
      const skip = (pageNum - 1) * take;
      const [total, datas] = await prisma.$transaction([
        model.count({ where }),
        model.findMany({
          where,
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
          ...(include ? { include } : {}),
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
        filters,
      };
    }
  }

  async getUserByRoleName(roleName: string) {
    const role = await this.prisma.role.findFirst({
      where: { name: { equals: roleName, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!role) {
      return [];
    }
    const users = await this.prisma.user.findMany({
      where: { roleId: role.id },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
      },
    });
    return users;
  }

  async getBulkUserById(userIds: string[]) {
    if (!userIds?.length) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
      },
    });
    return users;
  }

  async sendNotificationInApp(params: {
    entityId?: string;
    titleIndonesia: string;
    titleEnglish: string;
    descriptionIndonesia: string;
    descriptionEnglish: string;
    subjectType?: string;
    subjectId?: string;
    audienceScope?: AudienceScope;
    audienceUserIds?: string[];
    audienceRoleIds?: string[];
    roleNames?: string[];
    sendAt?: Date;
    channels: NotificationChannel[];
    templateKey?: string;
    perChannel?: any;
    additionalData?: Record<string, any>;
  }) {
    type ChannelKey =
      | 'IN_APP'
      | 'EMAIL'
      | 'PUSH'
      | 'WHATSAPP'
      | 'SMS'
      | 'WEBHOOK';
    const {
      titleIndonesia,
      titleEnglish,
      descriptionIndonesia,
      descriptionEnglish,
      subjectType,
      subjectId,
      audienceScope = AudienceScope.GLOBAL,
      audienceUserIds = [],
      audienceRoleIds = [],
      roleNames = [],
      sendAt,
      channels = [NotificationChannel.IN_APP],
      templateKey,
      perChannel = {},
      additionalData,
    } = params;
    const [indLang, engLang] = await Promise.all([
      this.prisma.language.findFirst({ where: { code: 'id_ID' } }),
      this.prisma.language.findFirst({ where: { code: 'en_US' } }),
    ]);
    if (!indLang || !engLang)
      throw new BadRequestException('Required languages not found');
    let mergedRoleIds = audienceRoleIds;
    if (roleNames.length) {
      const roles = await this.prisma.role.findMany({
        where: { name: { in: roleNames } },
        select: { id: true },
      });
      mergedRoleIds = Array.from(
        new Set([...audienceRoleIds, ...roles.map((r) => r.id)]),
      );
    }
    const effectiveScope = mergedRoleIds.length
      ? AudienceScope.ROLE
      : audienceScope;
    const entity = await this.prisma.entity.create({
      data: { type: 'NOTIFICATION', createdAt: new Date() },
    });
    const now = new Date();
    await this.prisma.translation.createMany({
      data: [
        {
          entityId: entity.id,
          languageId: indLang.id,
          field: 'title',
          translation: titleIndonesia,
          createdAt: now,
          updatedAt: now,
        },
        {
          entityId: entity.id,
          languageId: indLang.id,
          field: 'message',
          translation: descriptionIndonesia,
          createdAt: now,
          updatedAt: now,
        },
        {
          entityId: entity.id,
          languageId: engLang.id,
          field: 'title',
          translation: titleEnglish,
          createdAt: now,
          updatedAt: now,
        },
        {
          entityId: entity.id,
          languageId: engLang.id,
          field: 'message',
          translation: descriptionEnglish,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
    const notification = await this.prisma.notifications.create({
      data: {
        entityId: entity.id,
        data: additionalData,
        channels,
        status: sendAt ? NotificationStatus.SCHEDULED : NotificationStatus.SENT,
        scope: effectiveScope,
        subjectType,
        subjectId,
        sendAt,
        createdAt: now,
        updatedAt: now,
      },
    });
    let recipientUserIds: string[] = [];
    if (effectiveScope === AudienceScope.USER && audienceUserIds.length) {
      await this.prisma.notificationAudienceUser.createMany({
        data: audienceUserIds.map((userId) => ({
          notificationId: notification.id,
          userId,
        })),
      });
      recipientUserIds = audienceUserIds;
    } else if (effectiveScope === AudienceScope.ROLE && mergedRoleIds.length) {
      await this.prisma.notificationAudienceRole.createMany({
        data: mergedRoleIds.map((roleId) => ({
          notificationId: notification.id,
          roleId,
        })),
      });
      const users = await this.prisma.user.findMany({
        where: { roleId: { in: mergedRoleIds } },
        select: { id: true },
      });
      recipientUserIds = users.map((u) => u.id);
    } else {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      recipientUserIds = users.map((u) => u.id);
    }
    recipientUserIds = Array.from(new Set(recipientUserIds));
    if (recipientUserIds.length) {
      await this.prisma.notificationRecipient.createMany({
        data: recipientUserIds.map((userId) => ({
          notificationId: notification.id,
          userId,
          createdAt: now,
          updatedAt: now,
        })),
      });
    }
    const savedRecipients = await this.prisma.notificationRecipient.findMany({
      where: { notificationId: notification.id },
      select: { id: true, userId: true },
    });
    const deliveries = savedRecipients.flatMap((r) =>
      channels.map((ch) => ({
        recipientId: r.id,
        channel: ch,
        templateKey: perChannel[ch as ChannelKey]?.templateKey ?? templateKey,
        payload: {
          titleIndonesia,
          titleEnglish,
          descriptionIndonesia,
          descriptionEnglish,
          ...(additionalData || {}),
          ...(perChannel[ch as ChannelKey]?.payload || {}),
        },
        status: DeliveryStatus.SENT,
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
      })),
    );
    if (deliveries.length) {
      await this.prisma.notificationDelivery.createMany({ data: deliveries });
    }
    if (!sendAt) {
      await this.prisma.notifications.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENDING },
      });
    }
    return notification;
  }

  async sendNotificationEmail(params: {
    subject: string;
    body?: string;
    toUserIds?: string[];
    roleNames?: string[];
    audienceRoleIds?: string[];
    templateKey?: string;
    additionalData?: Record<string, any>;
  }) {
    const {
      subject,
      body,
      toUserIds = [],
      roleNames = [],
      audienceRoleIds = [],
      templateKey,
      additionalData = {},
    } = params;
    const targetUserIds = new Set<string>(toUserIds);
    if (roleNames.length || audienceRoleIds.length) {
      let roleIds = [...audienceRoleIds];
      if (roleNames.length) {
        const roles = await this.prisma.role.findMany({
          where: { name: { in: roleNames } },
          select: { id: true },
        });
        roleIds = Array.from(new Set([...roleIds, ...roles.map((r) => r.id)]));
      }
      if (roleIds.length) {
        const usersByRole = await this.prisma.user.findMany({
          where: { roleId: { in: roleIds } },
          select: { id: true },
        });
        usersByRole.forEach((u) => targetUserIds.add(u.id));
      }
    }
    const userIds = Array.from(targetUserIds);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { email: true, name: true },
    });
    if (!users.length) {
      throw new BadRequestException('No users found for email notification');
    }
    if (!this.transporter) {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER || 'dimdevs.developer@gmail.com',
          pass:
            process.env.MAIL_PASS?.replace(/"/g, '') || 'rdiz nbmq qyom lplv',
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
      });
    }
    const htmlBody = body ?? '';
    const delayMs = Number(process.env.MAIL_SEND_DELAY_MS || 250);
    let templatePath: string | null = null;
    if (templateKey) {
      const parts = templateKey.split('.');
      const fileName = parts.pop();
      const folders = parts;
      templatePath = path.join(
        process.cwd(),
        'dist',
        'email',
        'templates',
        'email',
        ...folders,
        `${fileName}.ejs`,
      );
    }
    for (const user of users) {
      if (!user.email) continue;
      const additionalDataUser = {
        ...additionalData,
        recipientName: user.name,
      };
      let htmlBodyUser = htmlBody;
      if (templatePath) {
        htmlBodyUser = await ejs.renderFile(templatePath, {
          data: additionalDataUser,
        });
      }
      const mailOptions = {
        from: `${process.env.MAIL_FROM_NAME || 'TRAVL'} <${
          process.env.MAIL_FROM_EMAIL || 'admin@travl.co.id'
        }>`,
        to: user.email,
        subject,
        html: htmlBodyUser,
      };
      await this.transporter.sendMail(mailOptions);
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return { message: `Email notification sent to ${users.length} user(s)` };
  }

  // GOOGLE INITIAL
  async initializeOAuth2Client(email: string) {
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

    try {
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
          orderId: eventData.orderId,
          bookingId: eventData.bookingId,
        },
      });

      return {
        createdEvent: insertedEvent.data,
      };
    } catch (error) {
      console.error('Error membuat event Google Calendar:', {
        message: error.message,
        code: error.code,
        details: error.errors,
      });
      throw new BadRequestException(
        `Gagal membuat event Google Calendar: ${error.message}`,
      );
    }
  }
}
