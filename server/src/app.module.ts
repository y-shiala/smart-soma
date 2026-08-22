import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PreferencesModule } from './preferences/preferences.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { LearningModule } from './learning/learning.module.js';

@Module({
  imports: [PrismaModule, AuthModule, PreferencesModule, ProgressModule, LearningModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
