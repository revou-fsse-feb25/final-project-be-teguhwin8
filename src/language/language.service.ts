import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LanguageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLanguageDto: CreateLanguageDto) {
    try {
      const { code, name } = createLanguageDto;
      return await this.prisma.language.create({
        data: {
          code,
          name,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error(
          `Language code '${createLanguageDto.code}' already exists`,
        );
      }
      throw new Error(`Failed to create language: ${error.message}`);
    }
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      const where = search
        ? {
            OR: [
              { code: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {};

      const [languages, total] = await this.prisma.$transaction([
        this.prisma.language.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.language.count({ where }),
      ]);

      return {
        data: languages,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch languages: ${error.message}`);
    }
  }

  async findOne(id: number) {
    try {
      const language = await this.prisma.language.findUnique({
        where: { id },
      });
      if (!language) {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }
      return language;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch language: ${error.message}`);
    }
  }

  async update(id: number, updateLanguageDto: UpdateLanguageDto) {
    try {
      const language = await this.prisma.language.findUnique({
        where: { id },
      });
      if (!language) {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }
      return await this.prisma.language.update({
        where: { id },
        data: updateLanguageDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new Error(
          `Language code '${updateLanguageDto.code}' already exists`,
        );
      }
      throw new Error(`Failed to update language: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      const language = await this.prisma.language.findUnique({
        where: { id },
      });
      if (!language) {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }
      return await this.prisma.language.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete language: ${error.message}`);
    }
  }
}
