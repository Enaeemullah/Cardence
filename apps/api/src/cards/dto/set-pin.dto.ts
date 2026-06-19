import { IsString, Length, Matches } from 'class-validator';

export class SetPinDto {
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must be numeric digits only' })
  pin: string;
}
