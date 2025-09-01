import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the person sending the message',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the person sending the message',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+621234567890',
    description: 'Phone number of the person sending the message',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Inquiry about services',
    description: 'Subject of the message',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    example: 'I would like more information about your services.',
    description: 'Content of the message',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    example: false,
    description: 'Flag indicating if the message has been read',
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
