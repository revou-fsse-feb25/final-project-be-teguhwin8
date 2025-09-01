/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcrypt';
import { GlobalService } from 'src/global/global.service';
import { MailService } from 'src/mail/mail/mail.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private readonly globalService: GlobalService,
    private mailService: MailService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  async generateOTP() {
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
        where: {
          otp: parseInt(otp),
        },
      });
    } while (validateOtp);
    return otp;
  }

  async register(body: any) {
    const isEmailValid = await this.prisma.user.findFirst({
      where: {
        email: body.email,
        deletedAt: null,
      },
    });
    if (isEmailValid) {
      return new UnauthorizedException('email already exist');
    }
    if (body.password != body.password_confirmation) {
      return new UnauthorizedException(
        'password does not match with password confirmation',
      );
    }
    if (body.password.length == null) {
      return new UnauthorizedException(
        'password does not require for that length',
      );
    }
    if (body.password.length < 6) {
      return new UnauthorizedException('Password less than 6 characters');
    }
    const otp = this.generateOTP();
    const hashPassword = await bcrypt.hash(body.password, 10);
    try {
      const role = await this.prisma.role.findFirst({});
      body.roleId = role.id;
      const user = await this.prisma.user.create({
        data: {
          roleId: role.id,
          email: body.email,
          otp: parseInt(await otp),
          phoneNumber: body.phoneNumber,
          type: body.type,
          password: hashPassword,
        },
      });
      const payload = { sub: user.id, email: user.email };
      const expiresInDays = 1000;
      const token = this.jwt.sign(payload, { expiresIn: `${expiresInDays}d` });
      if (body.notifyBy == 'email') {
        this.eventEmitter.emit('register.succeed', {
          name: user.email,
          otp: (await otp).toString(),
          email: user.email,
        });
        this.eventEmitter.emit('update-device', {
          user_id: user.id,
          subscription_details: body.subscription_details,
        });
      } else {
        // notify whatsapp
        const customHeaders = {
          'Qiscus-App-Id': 'gfteg-hh7urzdmnar2qyi',
          'Qiscus-Secret-Key': '0b352b5bd2db02c4e8947be50f33f306',
          'Content-Type': 'application/json',
        };
        const otpWA = (await otp).toString();
        const component = [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otpWA,
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
                text: otpWA,
              },
            ],
          },
        ];

        const bodyWA = {
          to: body.phoneNumber,
          type: 'template',
          template: {
            namespace: '8cf138e3_0de3_4941_a1aa_b7f9fd744c21',
            name: 'otp',
            language: {
              policy: 'deterministic',
              code: 'id',
            },
            components: component,
          },
        };
        await this.globalService.whatsappQisqus(bodyWA, customHeaders);
      }
      const result = await this.prisma.user.findUnique({
        where: { id: user.id, deletedAt: null },
        include: {},
      });
      const response = {
        code: 200,
        message: 'Successfully',
        token,
        data: result,
      };
      return response;
    } catch (error) {
      console.error(
        'Terjadi kesalahan saat membuat user atau customer:',
        error,
      );
      throw error;
    }
  }

  async validateUser(loginDto: LoginDto) {
    const isUserValid = await this.prisma.user.findFirst({
      where: { email: loginDto.email, deletedAt: null },
    });
    if (!isUserValid)
      throw new NotFoundException(`No user found for email: ${loginDto.email}`);
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      isUserValid.password,
    );
    if (loginDto.password.length < 6)
      throw new UnauthorizedException('Password less than 6 characters');
    if (!isPasswordValid) throw new UnauthorizedException('Wrong Password');
    const payload = { sub: isUserValid.id, name: isUserValid.email };
    return { token: this.jwt.sign(payload) };
  }

  async resetPassword(request: any) {
    const user = await this.prisma.user.findFirst({
      where: { email: request.email, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException(`No user found for email: ${request.email}`);
    }

    if (request.password != request.password_confirmation) {
      throw new UnauthorizedException('Password Not Same');
    }
    this.mailService.sendEmailSuccessResetPassword(request);
    const hashPassword = await bcrypt.hash(request.password, 10);
    const datas = await this.prisma.user.update({
      data: {
        password: hashPassword,
      },
      where: { id: user.id },
    });
    return this.globalService.response('Successfully', datas);
  }

  async resendOTP(request: any) {
    const user = await this.prisma.user.findFirst({
      where: { email: request.email, deletedAt: null },
    });
    if (!user) {
      return {
        code: 401,
        message: 'User Not Found!',
      };
    }
    const otp = this.generateOTP();
    this.eventEmitter.emit('register.succeed', {
      name: user.email,
      otp: (await otp).toString(),
      email: user.email,
    });
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otp: parseInt(await otp),
      },
    });
    const result = await this.prisma.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });
    return this.globalService.response('Successfully', result);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email, deletedAt: null },
      include: {
        role: {
          include: {
            permission: {
              include: {
                permission: true,
              },
            },
          },
        },
        operator: true,
      },
    });
    if (!user) {
      return {
        code: 401,
        message: 'Unauthorized',
      };
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (isPasswordValid) {
      // this.eventEmitter.emit('update-device', {
      //   user_id: user.id,
      //   subscription_details: loginDto.subscription_details,
      // });

      const payload = { sub: user.id, email: user.email };
      const expiresInDays = 1000;
      const token = this.jwt.sign(payload, { expiresIn: `${expiresInDays}d` });
      return {
        code: 200,
        message: 'Successfully',
        token: token,
        data: user,
      };
    } else {
      return {
        code: 401,
        message: 'Unauthorized',
      };
    }
  }

  async forgotPassword(loginDto: LoginDto) {
    const isUserValid = await this.prisma.user.findFirst({
      where: { email: loginDto.email, deletedAt: null },
    });

    this.eventEmitter.emit('user.reset-password', {
      name: isUserValid.email,
      email: isUserValid.email,
      link: 'http://enaganteng.com',
    });

    return this.globalService.response('Successfully', isUserValid);
  }

  async loginByGoogle(body: any) {
    const validNames = ['customer'] as const;

    if (!validNames.includes(body.type)) {
      return this.globalService.response(
        'Invalid name, unable to login with Google',
        {},
        401,
      );
    }
    if (
      body.token !==
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YjNjMjUyOS1iN2YzLTQyMDEtOTMwOC0wMzc5MTJlYmNlNzgiLCJlbWFpbCI6InVkaW5AZ21haWwuY29tIiwiaWF0IjoxNjk3MTkyNzEwLCJleHAiOjE2OTcxOTYzMTB9'
    ) {
      return this.globalService.response('Wrong Token!', {}, 401);
    }
    const [role, library] = await Promise.all([
      this.prisma.role.findFirst({ where: { name: body.type } }),
      this.prisma.library.findFirst({ where: { code: 'TRV' } }),
    ]);

    if (!role) {
      return this.globalService.response('Role not found', {}, 400);
    }
    let user = await this.prisma.user.findFirst({
      where: { email: body.email, deletedAt: null },
    });

    const defaultPassword = 'hijau123';

    if (!user) {
      const hashPassword = await bcrypt.hash(defaultPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email: body.email,
          type: role.name,
          password: hashPassword,
          roleId: role.id,
          operatorId: library ? library.id : null,
          googleId: body.googleId ?? null,
          googleAccessToken: body.accessToken ?? null,
          googleTokenExpiryDate: body.googleTokenExpiryDate ?? null,
          googleRefreshToken: body.refreshToken ?? null,
          googleScopes: body.scopes ?? null,
          isVerifiedOTP: true,
          emailVerifiedAt: new Date(),
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          type: user.type ?? role.name,
          roleId: user.roleId ?? role.id,
          operatorId: user.operatorId ?? (library ? library.id : null),
          googleId: body.googleId ?? user.googleId,
          googleAccessToken: body.accessToken ?? user.googleAccessToken,
          googleRefreshToken: body.refreshToken ?? user.googleRefreshToken,
          googleScopes: body.scopes ?? user.googleScopes,
          googleTokenExpiryDate: body.googleTokenExpiryDate ?? null,
          isVerifiedOTP: user.isVerifiedOTP || true,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        },
      });
    }

    let customer = await this.prisma.customer.findFirst({
      where: { userId: user.id, deletedAt: null },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          code: await this.globalService.generateCustomerCode(this.prisma),
          userId: user.id,
        },
      });
    }

    const result = await this.prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
      include: {
        role: true,
        operator: true,
        customer: true,
      },
    });

    const finalResult = { ...result, customer };
    const payload = { sub: user.id, email: user.email };
    const expiresInDays = 1000;
    const token = this.jwt.sign(payload, { expiresIn: `${expiresInDays}d` });

    return {
      code: 200,
      message: 'Successfully logged in with Google',
      token,
      data: finalResult,
    };
  }

  async loginByApple(body: any) {
    let isUserValid = null;
    if ((body.type = 'parent')) {
      isUserValid = await this.prisma.user.findFirst({
        where: { email: body.email, deletedAt: null },
        include: {},
      });
    }
    const role = await this.prisma.role.findFirst({});
    if (
      body.token ==
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YjNjMjUyOS1iN2YzLTQyMDEtOTMwOC0wMzc5MTJlYmNlNzgiLCJlbWFpbCI6InVkaW5AZ21haWwuY29tIiwiaWF0IjoxNjk3MTkyNzEwLCJleHAiOjE2OTcxOTYzMTB9'
    ) {
      const defaultPassword = 'hijau123';
      if (!isUserValid) {
        const hashPassword = await bcrypt.hash(defaultPassword, 10);
        if ((body.type = 'parent')) {
          isUserValid = await this.prisma.user.create({
            data: {
              email: body.email,
              type: body.type,
              password: hashPassword,
              roleId: role.id,
            },
            include: {},
          });
        } else {
          isUserValid = await this.prisma.user.create({
            data: {
              email: body.email,
              type: body.type,
              password: hashPassword,
              roleId: role.id,
            },
          });
        }
      }
      const result = await this.prisma.user.findFirst({
        where: { email: body.email, deletedAt: null },
        include: {},
      });

      this.eventEmitter.emit('update-device', {
        user_id: result.id,
        subscription_details: body.subscription_details,
      });

      const payload = { sub: isUserValid.id, email: isUserValid.email };
      const expiresInDays = 1000;
      const token = this.jwt.sign(payload, { expiresIn: `${expiresInDays}d` });
      return {
        code: 200,
        message: 'Successfully',
        token,
        data: result,
      };
    } else {
      return this.globalService.response('Wrong Token!', {});
    }
  }

  async loginByWhatsapp(body: any) {
    let isUserValid = null;
    try {
      const role = await this.prisma.role.findFirst({
        where: { name: body.type },
      });
      const hardcodedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YjNjMjUyOS1iN2YzLTQyMDEtOTMwOC0wMzc5MTJlYmNlNzgiLCJlbWFpbCI6InVkaW5AZ21haWwuY29tIiwiaWF0IjoxNjk3MTkyNzEwLCJleHAiOjE2OTcxOTYzMTB9';
      if (!role)
        return this.globalService.response('Invalid role type', {}, 400);
      if (body.token !== hardcodedToken)
        return this.globalService.response('Unauthorized', {}, 401);
      if (body.type === 'customer') {
        isUserValid = await this.prisma.user.findFirst({
          where: { phoneNumber: body.phoneNumber, deletedAt: null },
        });
      }
      const library = await this.prisma.library.findFirst({
        where: { code: 'TRV' },
      });
      if (!isUserValid) {
        const defaultPassword = 'hijau123';
        const hashPassword = await bcrypt.hash(defaultPassword, 10);
        isUserValid = await this.prisma.user.create({
          data: {
            phoneNumber: body.phoneNumber,
            type: role.name,
            password: hashPassword,
            roleId: role.id,
            otp: parseInt(body.otp),
            operatorId: library ? library.id : null,
          },
        });
        await this.sendWhatsappMessage(body.phoneNumber, body.otp);
      }
      await this.prisma.user.update({
        where: { id: isUserValid.id },
        data: {
          otp: parseInt(body.otp),
          isVerifiedOTP: false,
          operatorId: library ? library.id : null,
        },
      });
      const result = await this.prisma.user.findFirst({
        where: { phoneNumber: body.phoneNumber, deletedAt: null },
        include: {
          role: true,
        },
      });
      return this.globalService.response('Successfully logged in', result);
    } catch (error) {
      console.error('Error during WhatsApp login:', error);
      return this.globalService.response('Internal Server Error', {}, 500);
    }
  }

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

  async verifyOtp(data: any) {
    try {
      let user;

      if (data.phoneNumber) {
        user = await this.prisma.user.findFirst({
          where: {
            otp: data.otp,
            phoneNumber: data.phoneNumber,
            deletedAt: null,
          },
        });
      } else {
        user = await this.prisma.user.findFirst({
          where: {
            otp: data.otp,
            email: data.email,
            deletedAt: null,
          },
        });
      }

      if (user) {
        await this.prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            isVerifiedOTP: true,
          },
        });

        const result = await this.prisma.user.findFirst({
          where: {
            id: user.id,
            deletedAt: null,
          },
          include: {
            role: true,
            operator: true,
            customer: true,
          },
        });

        const isCustomer = await this.prisma.customer.findFirst({
          where: { userId: result.id, deletedAt: null },
        });
        if (!isCustomer) {
          await this.prisma.customer.create({
            data: {
              code: await this.globalService.generateCustomerCode(this.prisma),
              userId: result.id,
            },
          });
        }
        const payload = { sub: user.id, email: user.email };
        const expiresInDays = 1000;
        const token = this.jwt.sign(payload, {
          expiresIn: `${expiresInDays}d`,
        });

        return {
          code: 200,
          message: 'Successfully',
          token,
          data: result,
        };
      } else {
        return this.globalService.response('OTP Not Match!!', {}, 201);
      }
    } catch (error) {
      console.error('Login error:', error);
      return this.globalService.response('Internal Server Error', {}, 500);
    }
  }

  async verifyPin(request: any) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: request.userId,
          deletedAt: null,
        },
      });
      if (!user)
        return this.globalService.response('User Not Found!!', {}, 201);

      if (user) {
        if (request.changePin) {
          const encryptedPin = await this.globalService.encrypt(request.pin);
          await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              pin: encryptedPin,
            },
          });
        } else {
          if (!user.pin) {
            const encryptedPin = await this.globalService.encrypt(request.pin);
            await this.prisma.user.update({
              where: {
                id: user.id,
              },
              data: {
                pin: encryptedPin,
              },
            });
          } else {
            const decryptedPin = await this.globalService.decrypt(user.pin);
            if (decryptedPin !== request.pin) {
              return this.globalService.response('PIN Not Match!!', {}, 201);
            }
          }
        }
        const result = await this.prisma.user.findFirst({
          where: {
            id: user.id,
            deletedAt: null,
          },
          include: {
            role: true,
            operator: true,
            customer: true,
          },
        });
        const payload = { sub: user.id, email: user.email };
        const expiresInDays = 1000;
        const token = this.jwt.sign(payload, {
          expiresIn: `${expiresInDays}d`,
        });

        return {
          code: 200,
          message: 'Successfully',
          token,
          data: result,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return this.globalService.response('Internal Server Error', {}, 500);
    }
  }

  async mergeAccount(targetUserId: string, sourceUserId: string) {
    // 1. Get both customers
    const targetCustomer = await this.prisma.customer.findFirst({
      where: { userId: targetUserId, deletedAt: null },
    });
    const sourceCustomer = await this.prisma.customer.findFirst({
      where: { userId: sourceUserId, deletedAt: null },
      include: {
        user: true
      }
    });
    if (!targetCustomer || !sourceCustomer) {
      throw new NotFoundException('Customer not found for one or both userIds');
    }

    // 2. Update all transactions from sourceCustomer to targetCustomer
    await this.prisma.order.updateMany({
      where: { customerId: sourceCustomer.id },
      data: { customerId: targetCustomer.id },
    });
    await this.prisma.invoice.updateMany({
      where: { customerId: sourceCustomer.id },
      data: { customerId: targetCustomer.id },
    });
    await this.prisma.customerBank.updateMany({
      where: { customerId: sourceCustomer.id },
      data: { customerId: targetCustomer.id },
    });
    await this.prisma.customerPassenger.updateMany({
      where: { customerId: sourceCustomer.id },
      data: { customerId: targetCustomer.id },
    });
    await this.prisma.subscriptionOrder.updateMany({
      where: { customerId: sourceCustomer.id },
      data: { customerId: targetCustomer.id },
    });
    await this.prisma.testimonial.updateMany({
      where: { customerId: sourceCustomer.id },
      data: { customerId: targetCustomer.id },
    });
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        phoneNumber: sourceCustomer.user.phoneNumber || '',
        phoneVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
      }
    });
    await this.prisma.customer.delete({
      where: { id: sourceCustomer.id },
    });
    await this.prisma.user.delete({
      where: { id: sourceUserId },
    });

    return this.globalService.response('Akun berhasil digabungkan', {
      targetUserId,
      sourceUserId,
    });
  }
}
