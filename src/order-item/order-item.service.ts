import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalService } from '../global/global.service';

@Injectable()
export class OrderItemService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(data: any) {
    try {
      const code =
        data.code ||
        (await this.globalService.generateOrderItemCode(this.prisma));
      const item = await this.prisma.orderItem.create({
        data: {
          code,
          tripSeatId: data.tripSeatId,
          orderId: data.orderId,
          name: data.name,
          address: data.address,
          phoneNumber: data.phoneNumber,
          price: data.price,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
          deletedAt: data.deletedAt ?? null,
        },
      });
      return this.globalService.response('Successfully created', item);
    } catch (error) {
      console.error('Create error:', error);
      throw new InternalServerErrorException('Failed to create order item');
    }
  }

  async findAll(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.customerId) {
        whereConditions['order'] = {
          customerId: request.customerId,
        };
      }
      const items = await this.prisma.orderItem.findMany({
        where: whereConditions,
      });
      return this.globalService.response('Successfully', items);
    } catch (error) {
      console.error('Find all error:', error);
      throw new InternalServerErrorException('Failed to get order items');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.prisma.orderItem.findUnique({
        where: { id },
      });
      if (!item || item.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      return this.globalService.response('Successfully', item);
    } catch (error) {
      console.error('Find one error:', error);
      throw new InternalServerErrorException('Failed to get order item');
    }
  }

  async update(id: string, data: any) {
    try {
      const item = await this.prisma.orderItem.update({
        where: { id },
        data: {
          tripSeatId: data.tripSeatId,
          orderId: data.orderId,
          name: data.name,
          address: data.address,
          phoneNumber: data.phoneNumber,
          price: data.price,
          updatedAt: new Date(),
        },
      });
      return this.globalService.response('Successfully updated', item);
    } catch (error) {
      console.error('Update error:', error);
      throw new InternalServerErrorException('Failed to update order item');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.orderItem.findUnique({
        where: { id },
      });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const deleted = await this.prisma.orderItem.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully deleted', deleted);
    } catch (error) {
      console.error('Delete error:', error);
      throw new InternalServerErrorException('Failed to delete order item');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.orderItem.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.orderItem.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Restore error:', error);
      throw new InternalServerErrorException('Failed to restore order item');
    }
  }
}
