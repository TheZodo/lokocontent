import { Transform } from 'class-transformer'
import { IsInt, IsOptional, Min } from 'class-validator'

const toNumber = ({ value }: { value: string | number | undefined }) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  return Number(value)
}

export class MyPurchasesQueryDto {
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  limit?: number

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  offset?: number
}
