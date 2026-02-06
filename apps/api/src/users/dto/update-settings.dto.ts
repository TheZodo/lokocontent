import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

const toBoolean = ({ value }: { value: string | boolean | undefined }) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value
  }
  return value === 'true'
}

export class UpdateSettingsDto {
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  emailNotifications?: boolean

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  newFollowerNotifications?: boolean

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  contentUpdateNotifications?: boolean

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  earningsNotifications?: boolean

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  watchHistoryEnabled?: boolean
}
