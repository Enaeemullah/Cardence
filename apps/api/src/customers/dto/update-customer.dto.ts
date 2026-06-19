import { IsDateString, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
