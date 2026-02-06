import { Transform } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'

const toNumber = ({ value }: { value: string | number }) => Number(value)

export class RateContentDto {
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number
}
