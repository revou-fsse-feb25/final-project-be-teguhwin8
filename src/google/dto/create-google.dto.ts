import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class DateTimeInput {
  @IsString()
  @IsNotEmpty()
  dateTime: string;

  @IsString()
  @IsNotEmpty()
  timeZone: string;
}

class AttendeeInput {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  responseStatus?: string;
}

class ReminderOverrideInput {
  @IsString()
  @IsNotEmpty()
  method: string;

  @IsNotEmpty()
  minutes: number;
}

class RemindersInput {
  @IsNotEmpty()
  useDefault: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderOverrideInput)
  @IsOptional()
  overrides?: ReminderOverrideInput[];
}

export class CreateGoogleDto {
  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DateTimeInput)
  start: DateTimeInput;

  @IsObject()
  @ValidateNested()
  @Type(() => DateTimeInput)
  end: DateTimeInput;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeInput)
  @IsOptional()
  attendees?: AttendeeInput[];

  @IsObject()
  @ValidateNested()
  @Type(() => RemindersInput)
  @IsOptional()
  reminders?: RemindersInput;

  @IsString()
  @IsEnum(['all', 'externalOnly', 'none'])
  @IsOptional()
  sendUpdates?: 'all' | 'externalOnly' | 'none';

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  bookingId?: string;
}
