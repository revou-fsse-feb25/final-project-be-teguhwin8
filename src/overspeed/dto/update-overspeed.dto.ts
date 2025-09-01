import { PartialType } from '@nestjs/swagger';
import { CreateOverspeedDto } from './create-overspeed.dto';

export class UpdateOverspeedDto extends PartialType(CreateOverspeedDto) {}
