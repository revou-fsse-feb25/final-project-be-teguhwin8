import { PartialType } from '@nestjs/swagger';
import { CreateContactContentDto } from './create-contact-content.dto';

export class UpdateContactContentDto extends PartialType(
  CreateContactContentDto,
) {}
