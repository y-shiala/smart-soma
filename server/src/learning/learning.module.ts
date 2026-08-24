import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AiModule } from '../ai/ai.module.js';
import { LearningController } from './learning.controller.js';
import { LearningService } from './learning.service.js';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [LearningController],
  providers: [LearningService],
})
export class LearningModule { }
