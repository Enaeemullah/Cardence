import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { CardNetwork, CardProductType } from '../../common/enums';

export class CreateCardProductDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsEnum(CardNetwork)
  network: CardNetwork;

  @IsEnum(CardProductType)
  productType: CardProductType;

  @IsInt()
  @Min(0)
  dailyLimitMinorUnits: number;

  @IsInt()
  @Min(0)
  perTxnLimitMinorUnits: number;

  @IsInt()
  @Min(1)
  velocityCount: number;

  @IsInt()
  @Min(1)
  velocityWindowSeconds: number;

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
