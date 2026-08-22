import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { PreferencesService } from './preferences.service.js';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  getPreferences(@CurrentUser() user: { id: string }) {
    return this.preferencesService.getPreferences(user.id);
  }

  @Patch()
  updatePreferences(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(user.id, dto);
  }
}