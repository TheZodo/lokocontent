import { Transform } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'

const toNumber = ({ value }: { value: string | number }) => Number(value)

export class UpdateHistoryDto {
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number
}
