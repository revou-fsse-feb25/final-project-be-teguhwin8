import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserManualStepsService } from './user-manual-steps.service';
import { CreateUserManualStepDto } from './dto/create-user-manual-step.dto';
import { UpdateUserManualStepDto } from './dto/update-user-manual-step.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('user-manual-steps')
export class UserManualStepsController {
  constructor(
    private readonly userManualStepsService: UserManualStepsService,
  ) {}

  @FormDataRequest()
  @Post()
  create(@Body() createUserManualStepDto: CreateUserManualStepDto) {
    return this.userManualStepsService.create(createUserManualStepDto);
  }

  @Get()
  findAll() {
    return this.userManualStepsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userManualStepsService.findOne(id);
  }

  @FormDataRequest()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserManualStepDto: UpdateUserManualStepDto,
  ) {
    return this.userManualStepsService.update(id, updateUserManualStepDto);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.userManualStepsService.restore(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userManualStepsService.remove(id);
  }
}
