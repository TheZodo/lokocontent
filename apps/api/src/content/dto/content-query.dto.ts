import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { PaginationDto } from './pagination.dto'

const toBoolean = ({ value }: { value: string | boolean | undefined }) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value
  }
  return value === 'true'
}

export class ContentListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  category?: string
}

export class ContentSearchQueryDto extends ContentListQueryDto {
  @IsString()
  @IsNotEmpty()
  q!: string

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isPremium?: boolean

  @IsOptional()
  @IsIn(['recent', 'views', 'rating'])
  sortBy?: 'recent' | 'views' | 'rating'
}
