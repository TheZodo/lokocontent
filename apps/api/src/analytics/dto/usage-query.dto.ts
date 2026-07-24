import { IsIn, IsOptional } from 'class-validator'

export class UsageQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'year'])
  period?: 'day' | 'week' | 'month' | 'year'
}
