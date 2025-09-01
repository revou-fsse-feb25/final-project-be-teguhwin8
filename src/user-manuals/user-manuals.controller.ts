import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UserManualsService } from './user-manuals.service';
import { CreateUserManualDto } from './dto/create-user-manual.dto';
import { UpdateUserManualDto } from './dto/update-user-manual.dto';

@Controller('user-manuals')
export class UserManualsController {
  constructor(private readonly userManualsService: UserManualsService) {}

  @Post()
  create(@Body() createUserManualDto: CreateUserManualDto) {
    return this.userManualsService.create(createUserManualDto);
  }

  @Get()
  findAll(
    @Query()
    searchParams: {
      title?: string;
      featuresId?: string;
      description?: string;
    },
  ) {
    return this.userManualsService.findAll(searchParams);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userManualsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserManualDto: UpdateUserManualDto,
  ) {
    return this.userManualsService.update(id, updateUserManualDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userManualsService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.userManualsService.restore(id);
  }
}
