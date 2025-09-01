import { PartialType } from '@nestjs/swagger';
import { CreateFaqContentDto } from './create-faq-content.dto';

export class UpdateFaqContentDto extends PartialType(CreateFaqContentDto) {}
