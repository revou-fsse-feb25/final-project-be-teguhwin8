import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class CustomerPassengerService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(data: {
    customerId: string;
    name?: string;
    phoneNumber?: string;
    address?: string;
  }) {
    try {
      const passenger = await this.prisma.customerPassenger.create({ data });
      return this.globalService.response('Successfully created', passenger);
    } catch (error) {
      console.error('Create error:', error);
      throw new InternalServerErrorException('Failed to create passenger');
    }
  }

  async findAll(customerId: string) {
    try {
      const passengers = await this.prisma.customerPassenger.findMany({
        where: { customerId, deletedAt: null },
      });
      return this.globalService.response('Successfully', passengers);
    } catch (error) {
      console.error('Find all error:', error);
      throw new InternalServerErrorException('Failed to get passengers');
    }
  }

  async findOne(id: string) {
    try {
      const passenger = await this.prisma.customerPassenger.findUnique({
        where: { id },
      });
      if (!passenger || passenger.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      return this.globalService.response('Successfully', passenger);
    } catch (error) {
      console.error('Find one error:', error);
      throw new InternalServerErrorException('Failed to get passenger');
    }
  }

  async update(
    id: string,
    data: { name?: string; phoneNumber?: string; address?: string },
  ) {
    try {
      const passenger = await this.prisma.customerPassenger.update({
        where: { id },
        data,
      });
      return this.globalService.response('Successfully updated', passenger);
    } catch (error) {
      console.error('Update error:', error);
      throw new InternalServerErrorException('Failed to update passenger');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.customerPassenger.findUnique({
        where: { id },
      });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const deleted = await this.prisma.customerPassenger.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully deleted', deleted);
    } catch (error) {
      console.error('Delete error:', error);
      throw new InternalServerErrorException('Failed to delete passenger');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.customerPassenger.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.customerPassenger.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Restore error:', error);
      throw new InternalServerErrorException('Failed to restore passenger');
    }
  }
}
