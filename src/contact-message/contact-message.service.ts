import { Injectable } from '@nestjs/common';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class ContactMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createContactMessageDto: CreateContactMessageDto) {
    try {
      const newContactMessage = await this.prisma.contactMessage.create({
        data: {
          ...createContactMessageDto,
        },
      });

      return {
        message: 'Contact message created successfully',
        data: newContactMessage,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to create contact message',
      );
    }
  }

  async findAll(page = 1, limit = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      console.log('search', search);

      const [contactMessages, total] = await this.prisma.$transaction([
        this.prisma.contactMessage.findMany({
          where: {
            deletedAt: null,
            ...(search && {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { subject: { contains: search } },
                { message: { contains: search } },
              ],
            }),
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.contactMessage.count({
          where: {
            deletedAt: null,
            ...(search && {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { subject: { contains: search } },
                { message: { contains: search } },
              ],
            }),
          },
        }),
      ]);

      if (total === 0) {
        return {
          message: 'No contact messages found',
          data: [],
          pagination: {
            page,
            limit,
            total,
            totalPages: 0,
          },
        };
      }

      return {
        message: 'Contact messages retrieved successfully',
        data: contactMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to fetch contact messages',
      );
    }
  }

  async findOne(id: string) {
    try {
      const contactMessage = await this.prisma.contactMessage.findUnique({
        where: { id },
      });

      if (!contactMessage) {
        throw new NotFoundException(`Contact message with id ${id} not found`);
      }

      return {
        message: 'Contact message retrieved successfully',
        data: contactMessage,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to fetch contact message',
      );
    }
  }

  async update(id: string, updateContactMessageDto: UpdateContactMessageDto) {
    try {
      const contactMessage = await this.prisma.contactMessage.findUnique({
        where: { id },
      });

      if (!contactMessage) {
        throw new NotFoundException(`Contact message with id ${id} not found`);
      }

      const updatedContactMessage = await this.prisma.contactMessage.update({
        where: { id },
        data: {
          ...updateContactMessageDto,
          updatedAt: new Date(),
        },
      });

      return {
        message: `Contact message with id ${id} updated successfully`,
        data: updatedContactMessage,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to update contact message',
      );
    }
  }

  async remove(id: string) {
    try {
      const contactMessage = await this.prisma.contactMessage.findUnique({
        where: { id },
      });

      if (!contactMessage) {
        throw new NotFoundException(`Contact message with id ${id} not found`);
      }

      const deletedContactMessage = await this.prisma.contactMessage.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return {
        message: `Contact message with id ${id} soft deleted successfully`,
        data: deletedContactMessage,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to delete contact message',
      );
    }
  }
}
