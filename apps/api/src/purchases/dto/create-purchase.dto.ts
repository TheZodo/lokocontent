import { Transform } from 'class-transformer'
import {
  IsIn,
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateIf,
  Matches,
} from 'class-validator'
import { PaymentProvider } from '@lokocontent/db'

const LIPILA = PaymentProvider.LIPILA

export const LIPILA_PAYMENT_METHODS = ['card', 'mobile_money'] as const
export type LipilaPaymentMethod = (typeof LIPILA_PAYMENT_METHODS)[number]

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  contentId!: string

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(Object.values(PaymentProvider))
  paymentProvider!: PaymentProvider

  /** Required when paymentProvider is LIPILA: 'card' or 'mobile_money' */
  @ValidateIf((o: CreatePurchaseDto) => o.paymentProvider === LIPILA)
  @IsIn(LIPILA_PAYMENT_METHODS)
  @IsNotEmpty({ message: 'paymentMethod is required when using Lipila' })
  paymentMethod?: LipilaPaymentMethod

  /** Required when paymentProvider is LIPILA and paymentMethod is 'mobile_money'. E.g. 260xxxxxxxxx */
  @ValidateIf(
    (o: CreatePurchaseDto) =>
      o.paymentProvider === LIPILA && o.paymentMethod === 'mobile_money',
  )
  @IsString()
  @IsNotEmpty({ message: 'phoneNumber is required for Lipila mobile money' })
  @Matches(/^260\d{9}$/, {
    message: 'phoneNumber must be Zambian format: 260 followed by 9 digits',
  })
  phoneNumber?: string
}
