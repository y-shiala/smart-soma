import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateProgressDto } from './dto/create-progress.dto.js';
import { ProgressService } from './progress.service.js';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  getProgress(@CurrentUser() user: { id: string }) {
    return this.progressService.getProgress(user.id);
  }

  @Get('history')
  getHistory(@CurrentUser() user: { id: string }) {
    return this.progressService.getHistory(user.id);
  }

  @Post()
  createProgress(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProgressDto,
  ) {
    return this.progressService.createProgress(user.id, dto);
  }
}