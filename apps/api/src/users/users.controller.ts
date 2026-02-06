import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Role, User } from '@lokocontent/db'
import { UsersService } from './users.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UpdateSettingsDto } from './dto/update-settings.dto'
import { UpdatePayoutDto } from './dto/update-payout.dto'
import { ApiExceptionFilter } from './filters/api-exception.filter'

@ApiTags('Users')
@Controller('users')
@UseGuards(ClerkAuthGuard)
@UseFilters(ApiExceptionFilter)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(
    @CurrentUser() userId: string,
  ): Promise<{ success: true; data: User }> {
    const user = await this.usersService.getMe(userId)
    return {
      success: true,
      data: user,
    }
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ success: true; data: User }> {
    const user = await this.usersService.updateProfile(userId, dto)
    return {
      success: true,
      data: user,
    }
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Update current user settings' })
  async updateSettings(
    @CurrentUser() userId: string,
    @Body() dto: UpdateSettingsDto,
  ): Promise<{ success: true; data: User }> {
    const user = await this.usersService.updateSettings(userId, dto)
    return {
      success: true,
      data: user,
    }
  }

  @Patch('me/payout')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Update payout settings (CREATOR or ADMIN)' })
  async updatePayout(
    @CurrentUser() userId: string,
    @Body() dto: UpdatePayoutDto,
  ): Promise<{ success: true; data: User }> {
    const user = await this.usersService.updatePayout(userId, dto)
    return {
      success: true,
      data: user,
    }
  }
}
