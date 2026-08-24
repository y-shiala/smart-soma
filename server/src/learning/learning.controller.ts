import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { SafeUser } from '../auth/auth.service.js';
import { ExplainQuestionDto } from './dto/explain-question.dto.js';
import { LearningService } from './learning.service.js';
import { PracticeQuestionDto } from './dto/practice-question.dto.js';
import { SubmitAttemptDto } from './dto/submit-attempt.dto.js';
import { CheckTeachingAnswerDto } from './dto/check-teaching-answer.dto.js';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('explanation')
  explainQuestion(
    @CurrentUser() user: SafeUser,
    @Body() dto: ExplainQuestionDto,
  ) {
    return this.learningService.generateExplanation(user, dto);
  }

  @Post('practice-question')
  practiceQuestion(
    @CurrentUser() user: SafeUser,
    @Body() dto: PracticeQuestionDto,
  ) {
    return this.learningService.generatePracticeQuestion(user, dto);
  }

  @Post('teaching-check')
  checkTeachingAnswer(
    @CurrentUser() user: SafeUser,
    @Body() dto: CheckTeachingAnswerDto,
  ) {
    return this.learningService.checkTeachingAnswer(user, dto);
  }

  @Post('attempts')
  submitAttempt(
    @CurrentUser() user: SafeUser,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.learningService.submitAttempt(user, dto);
  }
}
