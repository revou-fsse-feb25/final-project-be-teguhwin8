import { PartialType } from '@nestjs/swagger';
import { CreateUserManualStepDto } from './create-user-manual-step.dto';

export class UpdateUserManualStepDto extends PartialType(
  CreateUserManualStepDto,
) {}
