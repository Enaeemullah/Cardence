import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class CreateAccountDto {
  @IsUUID()
  customerId: string;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code (uppercase)' })
  currency: string;
}
