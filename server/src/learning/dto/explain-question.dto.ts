import { IsIn, IsString, MaxLength, Matches } from 'class-validator';

export class ExplainQuestionDto {
  @IsString()
  @MaxLength(500)
  @Matches(/\S/, {
    message: 'question must contain non-whitespace characters',
  })
  question!: string;

  @IsString()
  @MaxLength(100)
  @Matches(/\S/, {
    message: 'subject must contain non-whitespace characters',
  })
  subject!: string;

  @IsIn(['lower-primary', 'upper-primary', 'junior-high', 'senior-high'])
  grade!: string;

  @IsIn(['en', 'sw'])
  language!: string;

  @IsIn(['step-by-step', 'direct'])
  mode!: string;
}
