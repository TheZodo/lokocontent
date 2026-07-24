import { IsDateString, IsOptional } from 'class-validator'

export class UsageImportQueryDto {
  @IsDateString()
  date!: string
}

export class UsageImportsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
  to?: string
}
