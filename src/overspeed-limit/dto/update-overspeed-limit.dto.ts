import { PartialType } from '@nestjs/swagger';
import { CreateOverspeedLimitDto } from './create-overspeed-limit.dto';

export class UpdateOverspeedLimitDto extends PartialType(
  CreateOverspeedLimitDto,
) {}
