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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
// import { FormDataRequest } from 'nestjs-form-data';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() request: any) {
    return this.userService.create(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.userService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @UseInterceptors(FileInterceptor('photo'))
  async profile(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    return this.userService.updateProfile(body, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // Recovery Mode API
  @UseGuards(JwtAuthGuard)
  @Get('deleted/list')
  recovery(@Query() request) {
    return this.userService.findAllRecovery(request);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.userService.destroy(id);
  }
}
