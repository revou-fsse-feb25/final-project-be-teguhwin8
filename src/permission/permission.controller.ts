import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { BulkCreatePermissionDto } from './dto/bulk-create-permission.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request: any) {
    return this.permissionService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id);
  }

  // Maping Bulk
  @Post('bulk')
  createBulk(@Body() dto: BulkCreatePermissionDto) {
    return this.permissionService.createBulk(dto.names);
  }

  // Recovery Mode API
  @UseGuards(JwtAuthGuard)
  @Get('deleted/list')
  findAllRecovery(@Query() request: any) {
    return this.permissionService.findAllRecovery(request);
  }

  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.permissionService.restore(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.permissionService.destroy(id);
  }
}
