import { IsDateString, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
