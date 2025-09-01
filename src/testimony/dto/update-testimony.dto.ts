import { PartialType } from '@nestjs/swagger';
import { CreateTestimonyDto } from './create-testimony.dto';

export class UpdateTestimonyDto extends PartialType(CreateTestimonyDto) {}
