import { PartialType } from '@nestjs/swagger';
import { CreateUserManualDto } from './create-user-manual.dto';

export class UpdateUserManualDto extends PartialType(CreateUserManualDto) {}
