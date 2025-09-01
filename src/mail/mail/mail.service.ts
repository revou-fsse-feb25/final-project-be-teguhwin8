/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class MailService {
  website: string;
  sender: string;
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
    private mailerService: MailerService,
  ) {
    this.website = 'himovy.com';
    this.sender = 'noreply@himovy.com';
  }

  async generateOTP() {
    const length = 6;
    const characters = '0123456789';
    let otp = '';
    let validateOtp;
    do {
      otp = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(randomIndex);
      }
      validateOtp = await this.prisma.user.findFirst({
        where: {
          otp: parseInt(otp),
        },
      });
    } while (validateOtp);
    return otp;
  }

  async sendEmailResetPassword(request: any) {
    const path = require('path');
    const emailTemplatePath = path.join(
      __dirname,
      '../../../../src/mail/mail/resetPassword.ejs',
    );
    const validate = await this.prisma.user.findFirst({
      where: { email: request.email, deletedAt: null },
    });
    console.log(request);
    if (!validate) {
      return this.globalService.response('User Not Found!', {});
    }
    const otp = this.generateOTP();
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');
    const bodyEmail = ejs.render(emailTemplate, {
      website: this.website,
      passwordResetLink:
        'Kode verifikasi anda adalah : ' + (await otp).toString(),
    });
    await this.mailerService.sendMail({
      from: this.sender,
      to: request.email,
      subject: 'Reset Your Password - Link Expires in 30 Minutes',
      text: bodyEmail,
      html: bodyEmail,
    });
    await this.prisma.user.update({
      where: {
        id: validate.id,
      },
      data: {
        otp: parseInt(await otp),
      },
    });
    const result = await this.prisma.user.findFirst({
      where: { email: request.email, deletedAt: null },
    });
    return this.globalService.response('Email berhasil dikirim!', result);
  }

  async sendEmailSuccessRegistered(request: any) {
    const path = require('path');
    const emailTemplatePath = path.join(
      __dirname,
      '../../../../src/mail/mail/successRegistered.ejs',
    );

    const validate = await this.prisma.user.findFirst({
      where: { email: request.email, deletedAt: null },
    });
    console.log(request);
    if (!validate) {
      return this.globalService.response('User Not Found!', {});
    }
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');
    const bodyEmail = ejs.render(emailTemplate, {
      website: this.website,
    });

    await this.mailerService.sendMail({
      from: this.sender,
      to: request.email,
      subject:
        'Welcome to ' + this.website + ' - Your Registration is Complete!',
      text: bodyEmail,
      html: bodyEmail,
    });
  }

  async sendEmailSuccessResetPassword(request: any) {
    const path = require('path');
    const emailTemplatePath = path.join(
      __dirname,
      '../../../../src/mail/mail/successResetPassword.ejs',
    );

    const validate = await this.prisma.user.findFirst({
      where: { email: request.email, deletedAt: null },
    });
    console.log(request);
    if (!validate) {
      return this.globalService.response('User Not Found!', {});
    }
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');
    const bodyEmail = ejs.render(emailTemplate, {
      website: this.website,
    });

    await this.mailerService.sendMail({
      from: this.sender,
      to: request.email,
      subject: 'Your Password Has Been Successfully Updated',
      text: bodyEmail,
      html: bodyEmail,
    });
  }

  async sendEmailAppointment(request: any) {
    const path = require('path');
    const emailTemplatePath = path.join(
      __dirname,
      '../../../../src/mail/mail/successAppointment.ejs',
    );

    const validate = await this.prisma.user.findFirst({
      where: { email: request.data.parent.user.email, deletedAt: null },
    });
    if (!validate) {
      return this.globalService.response('User Not Found!', {});
    }
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');
    const bodyEmail = ejs.render(emailTemplate, {
      date: await this.globalService.formatDateToIndonesianLong(
        request.data.scheduleStaff.date,
      ),
      name: request.data.parent.name,
      startTime: request.data.scheduleStaff.timeStart,
      endTime: request.data.scheduleStaff.timeEnd,
      childId: request.childId,
      url: process.env.URL,
    });

    await this.mailerService.sendMail({
      from: this.sender,
      to: validate.email,
      subject: 'Konfirmasi Jadwal Interview dan Kelengkapan Data Anak',
      text: bodyEmail,
      html: bodyEmail,
    });
  }
}
