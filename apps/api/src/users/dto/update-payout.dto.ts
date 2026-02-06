import { Transform } from 'class-transformer'
import { IsEnum, IsOptional } from 'class-validator'
import { PayoutMethod } from '@lokocontent/db'

const normalizePayoutMethod = ({ value }: { value: string | PayoutMethod | undefined }) => {
  if (!value) {
    return undefined
  }
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'BANK') {
    return PayoutMethod.BANK
  }
  if (normalized === 'MOBILE_MONEY') {
    return PayoutMethod.MOBILE_MONEY
  }
  if (normalized === 'PAYPAL') {
    return PayoutMethod.PAYPAL
  }
  return value
}

export class UpdatePayoutDto {
  @Transform(normalizePayoutMethod)
  @IsEnum(PayoutMethod)
  payoutMethod!: PayoutMethod

  @IsOptional()
  payoutDetails?: Record<string, unknown>
}
