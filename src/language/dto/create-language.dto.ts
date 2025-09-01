import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;
}
