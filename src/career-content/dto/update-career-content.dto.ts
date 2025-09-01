import { PartialType } from '@nestjs/swagger';
import { CreateCareerContentDto } from './create-career-content.dto';

export class UpdateCareerContentDto extends PartialType(
  CreateCareerContentDto,
) {}
