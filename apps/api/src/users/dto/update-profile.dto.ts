import { IsOptional, IsString, IsNotEmpty } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bio?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  profilePicture?: string
}
