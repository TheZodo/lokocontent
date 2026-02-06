import { IsIn } from 'class-validator'

export class EarningsQueryDto {
  @IsIn(['week', 'month', 'year'])
  period!: 'week' | 'month' | 'year'
}
