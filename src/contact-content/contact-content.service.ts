import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateContactContentDto } from './dto/update-contact-content.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class ContactContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async findFirst() {
    try {
      let contactContent = await this.prisma.contactContent.findFirst({
        where: { deletedAt: null },
      });

      if (!contactContent) {
        contactContent = await this.prisma.contactContent.create({
          data: {
            address: 'Default Address',
            email: 'contact@example.com',
            phone: '+621234567890',
            whatsapp: '+6281234567890',
            instagram: 'https://instagram.com/example',
            facebook: 'https://facebook.com/example',
            twitter: 'https://twitter.com/example',
            tiktok: 'https://tiktok.com/@example',
            youtube: 'https://youtube.com/c/example',
            website: 'https://www.example.com',
            latitude: -6.2088,
            longitude: 106.8456,
          },
        });

        return {
          message: 'Contact content was empty, created default contact content',
          data: contactContent,
        };
      }

      return {
        message: 'Contact content retrieved successfully',
        data: contactContent,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to fetch or create contact content',
      );
    }
  }

  async update(id: string, updateContactContentDto: UpdateContactContentDto) {
    const {
      address,
      email,
      phone,
      whatsapp,
      instagram,
      facebook,
      twitter,
      tiktok,
      youtube,
      website,
      latitude,
      longitude,
    } = updateContactContentDto;

    try {
      const contactContent = await this.prisma.contactContent.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!contactContent) {
        throw new NotFoundException(`Contact content with id ${id} not found`);
      }

      const updatedContactContent = await this.prisma.contactContent.update({
        where: { id },
        data: {
          address,
          email,
          phone,
          whatsapp,
          instagram,
          facebook,
          twitter,
          tiktok,
          youtube,
          website,
          latitude,
          longitude,
          updatedAt: new Date(),
        },
      });

      return {
        message: `Contact content with id ${id} updated successfully`,
        data: updatedContactContent,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to update contact content',
      );
    }
  }
}
