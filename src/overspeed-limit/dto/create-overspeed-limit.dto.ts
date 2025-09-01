import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateOverspeedLimitDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  speedWarning?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  speedLimit?: number;
}
