import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { join } from 'path';
import { EventPayloads } from 'src/interface/event-types.interface';
import * as ejs from 'ejs';
@Injectable()
export class EmailService {
  private readonly baseTemplate: string;

  constructor(private readonly mailerService: MailerService) {
    this.baseTemplate = join(__dirname.replace('/src', ''), 'templates');
  }

  @OnEvent('register.succeed') //
  async welcomeEmail(data: EventPayloads['register.succeed']) {
    const { email, name, otp } = data;

    const subject = `Selamat Datang di MyRootsy!`;
    const template = join(this.baseTemplate, '/registerSucceed.ejs');

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      otp: otp,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('user.reset-password')
  async resetPasswordEmail(data: EventPayloads['user.reset-password']) {
    const { email, name, link } = data;

    const subject = `Permintaan Reset Kata Sandi MyRootsy Anda`;
    const template = join(this.baseTemplate, '/resetPassword.ejs');

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      link: link,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.reset-password')
  async successResetPassword(data: EventPayloads['success.reset-password']) {
    const { email, name } = data;

    const subject = `Reset Kata Sandi Berhasil`;
    const template = join(this.baseTemplate, '/successResetPassword.ejs');

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.registration-daily')
  async successRegistrationDaily(
    data: EventPayloads['success.registration-daily'],
  ) {
    const { email, name, date, members } = data;

    const subject = `Ringkasan Harian Pendaftaran MyRootsy ${date}`;
    const template = join(this.baseTemplate, '/successRegistrationDaily.ejs');

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      date: date,
      members,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.invitation-registration-on-admin')
  async successInvitationRegistrationAdmin(
    data: EventPayloads['success.invitation-registration-on-admin'],
  ) {
    const { email, name, password } = data;

    const subject = `Selamat Bergabung dengan MyRootsy!`;
    const template = join(
      this.baseTemplate,
      '/successInvitationRegistrationAdmin.ejs',
    );

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      password: password,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.invitation-registration-on-parent')
  async successInvitationRegistrationOnParent(
    data: EventPayloads['success.invitation-registration-on-parent'],
  ) {
    const { email, name, password } = data;

    const subject = `Selamat Bergabung dengan MyRootsy!`;
    const template = join(
      this.baseTemplate,
      '/successInvitationRegistrationOnParent.ejs',
    );

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      password: password,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.invitation-registration-on-staff')
  async successInvitationRegistrationOnStaff(
    data: EventPayloads['success.invitation-registration-on-staff'],
  ) {
    const { email, name, password } = data;

    const subject = `Selamat Bergabung dengan MyRootsy!`;
    const template = join(
      this.baseTemplate,
      '/successInvitationRegistrationOnStaff.ejs',
    );

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      password: password,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.invitation-registration-on-approved-pickup')
  async successInvitationRegistrationOnApprovedPickup(
    data: EventPayloads['success.invitation-registration-on-approved-pickup'],
  ) {
    const { email, name, password } = data;

    const subject = `Selamat Bergabung dengan MyRootsy!`;
    const template = join(
      this.baseTemplate,
      '/successInvitationRegistrationOnApprovedPickup.ejs',
    );

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      password: password,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.payment-customer')
  async successPaymentCustomer(
    data: EventPayloads['success.payment-customer'],
  ) {
    const { email, name, link } = data;

    const subject = `Pembayaran MyRootsy Berhasil`;
    const template = join(this.baseTemplate, '/successPaymentCustomer.ejs');

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      link: link,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.payment-finance')
  async successPaymentFinance(data: EventPayloads['success.payment-finance']) {
    const { email, name, link } = data;

    const subject = `Konfirmasi Pembayaran MyRootsy`;
    const template = join(this.baseTemplate, '/successPaymentFinance.ejs');

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      link: link,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.payment-expired-reminder')
  async successPaymentExpiredReminder(
    data: EventPayloads['success.payment-expired-reminder'],
  ) {
    const { email, name, expired_date, link } = data;

    const subject = `Pengingat Pembayaran MyRootsy`;
    const template = join(
      this.baseTemplate,
      '/successPaymentExpiredReminder.ejs',
    );

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      link: link,
      expired_date: expired_date,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }

  @OnEvent('success.invoice-reminder')
  async successInvoiceReminder(
    data: EventPayloads['success.invoice-reminder'],
  ) {
    const { email, name, expired_date, link, amount } = data;

    const subject = `Pemberitahuan Tagihan MyRootsy`;
    const template = join(this.baseTemplate, '/successInvoiceReminder.ejs');

    const renderedHtml = await ejs.renderFile(template, {
      name: name,
      email: email,
      link: link,
      expired_date: expired_date,
      amount: amount,
    });

    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: renderedHtml,
      html: renderedHtml,
    });
  }
}
