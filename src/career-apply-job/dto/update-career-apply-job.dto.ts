import { PartialType } from '@nestjs/swagger';
import { CreateCareerApplyJobDto } from './create-career-apply-job.dto';

export class UpdateCareerApplyJobDto extends PartialType(
  CreateCareerApplyJobDto,
) {}
