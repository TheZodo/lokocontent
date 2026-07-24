import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@lokocontent/db'
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { UsageService } from './usage.service'
import { UsageImportQueryDto, UsageImportsQueryDto } from './dto/usage-import-query.dto'

@ApiTags('Usage')
@Controller('usage')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post('mux/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import and reconcile Mux usage for a UTC date' })
  async importMuxUsage(@Query() query: UsageImportQueryDto) {
    const result = await this.usageService.importMuxUsageForDate(query.date)

    return {
      success: true,
      data: result,
    }
  }

  @Get('imports')
  @ApiOperation({ summary: 'List Mux usage import attempts' })
  async getImports(@Query() query: UsageImportsQueryDto) {
    const imports = await this.usageService.listImports(query)

    return {
      success: true,
      data: imports,
    }
  }
}
