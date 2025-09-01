import { IsString } from 'class-validator';

export class CreateFeaturesDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
