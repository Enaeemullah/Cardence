import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCardProductDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimitMinorUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  perTxnLimitMinorUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  velocityCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  velocityWindowSeconds?: number;

  @IsOptional()
  @IsBoolean()
  atmEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  posEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  ecomEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  intlEnabled?: boolean;
}
