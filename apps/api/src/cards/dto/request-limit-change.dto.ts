import { IsInt, IsOptional, Min } from 'class-validator';

export class RequestLimitChangeDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimitMinorUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  perTxnLimitMinorUnits?: number;
}
