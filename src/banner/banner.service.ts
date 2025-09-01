import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class BannerService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async findFirst() {
    try {
      let banner = await this.prisma.banner.findFirst({
        where: { deletedAt: null },
      });

      if (!banner) {
        banner = await this.prisma.banner.create({
          data: {
            badgeBanner: null,
            titleBanner: null,
            descriptionBanner: null,
            imageBanner: null,
          },
        });
      }

      return {
        code: 200,
        message: 'Successfully retrieved banner data',
        data: banner,
      };
    } catch (error) {
      console.error('Error in findFirst:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to retrieve banner data',
        data: null,
      });
    }
  }

  async updateFirst(
    id: string,
    updateBannerDto: UpdateBannerDto,
    file?: Express.Multer.File,
  ) {
    try {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];

      const updated = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.banner.findUnique({
          where: { id },
        });

        if (!existing || existing.deletedAt !== null) {
          throw new NotFoundException({
            code: 404,
            message: `Banner with ID ${id} not found or already deleted`,
            data: null,
          });
        }

        if (file) {
          if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException({
              code: 400,
              message:
                'Invalid imageBanner format. Only PNG, JPG, and JPEG are allowed.',
              data: null,
            });
          }

          const uploaded = await this.globalService.uploadFile({
            buffer: file.buffer,
            fileType: {
              mime: file.mimetype,
              ext: file.originalname.split('.').pop() || 'jpg',
            },
          });

          updateBannerDto.imageBanner = uploaded?.Location || null;
        }

        const banner = await tx.banner.update({
          where: { id },
          data: {
            ...updateBannerDto,
            updatedAt: new Date(),
          },
        });

        return banner;
      });

      return {
        code: 200,
        message: 'Successfully updated banner data',
        data: updated,
      };
    } catch (error) {
      console.error('Error in updateFirst:', error);
      throw new InternalServerErrorException({
        code: error.code || 500,
        message: error.message || 'Failed to update banner data',
        data: null,
      });
    }
  }
}
