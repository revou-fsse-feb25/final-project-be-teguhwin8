import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import axios from 'axios';

@Injectable()
export class CustomerBankService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const data = await this.prisma.customerBank.create({
        data: {
          customerId: request.customerId,
          nameAccount: request.nameAccount,
          codeAccount: request.codeAccount,
          nameBank: request.nameBank,
          codeBank: request.codeBank,
        },
      });
      const result = await this.prisma.customerBank.findFirst({
        where: { id: data.id },
        include: { customer: true },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(customerId?: string) {
    try {
      const whereClause: any = {};

      if (customerId) {
        whereClause.customerId = customerId;
      }

      const data = await this.prisma.customerBank.findMany({
        where: whereClause,
        include: {
          customer: true,
        },
      });

      return this.globalService.response('Successfully', data);
    } catch (error) {
      console.error('Find customer bank error:', error);
      throw new InternalServerErrorException(
        'Failed to get customer bank data',
      );
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.customerBank.findUnique({
        where: { id },
        include: { customer: true },
      });
      if (!datas || datas.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any) {
    try {
      const data = await this.prisma.customerBank.update({
        where: { id },
        data: {
          customerId: request.customerId,
          nameAccount: request.nameAccount,
          codeAccount: request.codeAccount,
          nameBank: request.nameBank,
          codeBank: request.codeBank,
        },
      });
      const result = await this.prisma.customerBank.findFirst({
        where: { id: data.id },
        include: { customer: true },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.customerBank.findUnique({
        where: { id },
      });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.customerBank.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.customerBank.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.customerBank.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async bankCode() {
    try {
      const apiKey = process.env.KEYXENDIT;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      };
      let bank;
      try {
        const response = await axios.get(
          'https://api.xendit.co/available_disbursements_banks',
          { headers },
        );
        bank = response.data;
      } catch (error) {
        console.error(
          'Error:',
          error.response ? error.response.data : error.message,
        );
      }
      return this.globalService.response('Successfully', bank);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
