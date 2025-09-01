import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

enum PolicyType {
  RESCHEDULE_POLICY = 'RESCHEDULE_POLICY',
  REFUND_CANCEL_POLICY = 'REFUND_CANCEL_POLICY',
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
}

export class CreatePolicyDto {
  @IsEnum(PolicyType)
  @IsNotEmpty()
  type: PolicyType;

  @IsString()
  @IsNotEmpty()
  titleIndonesia: string;

  @IsString()
  @IsNotEmpty()
  contentIndonesia: string;

  @IsString()
  @IsNotEmpty()
  titleEnglish: string;

  @IsString()
  @IsNotEmpty()
  contentEnglish: string;
}
