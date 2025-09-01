import { PartialType } from '@nestjs/swagger';
import { CreateFeaturesDto } from './create-feature.dto';

export class UpdateFeaturesDto extends PartialType(CreateFeaturesDto) {}
