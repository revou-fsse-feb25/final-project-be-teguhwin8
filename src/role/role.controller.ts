import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request: any) {
    return this.roleService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Post('add-permission')
  addPermission(@Body() request: any) {
    return this.roleService.addPermission(request);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post('assign-role-permission')
  assignRolePermission(@Body() request: AssignRolePermissionDto[]) {
    return this.roleService.assignPermissionsToRoles(request);
  }

  // Recovery Mode API
  @UseGuards(JwtAuthGuard)
  @Get('deleted/list')
  recovery(@Query() request) {
    return this.roleService.findAllRecovery(request);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.roleService.restore(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.roleService.destroy(id);
  }
}
