import { IsIn, IsInt, IsString, MaxLength, Matches, Min } from 'class-validator';

export class CheckTeachingAnswerDto {
  @IsString()
  @MaxLength(500)
  @Matches(/\S/)
  question!: string;

  @IsString()
  @MaxLength(100)
  @Matches(/\S/)
  subject!: string;

  @IsIn(['lower-primary', 'upper-primary', 'junior-high', 'senior-high'])
  grade!: string;

  @IsIn(['en', 'sw'])
  language!: string;

  @IsInt()
  @Min(1)
  stepNumber!: number;

  @IsString()
  @MaxLength(500)
  @Matches(/\S/)
  checkQuestion!: string;

  @IsString()
  @MaxLength(500)
  @Matches(/\S/)
  expectedAnswer!: string;

  @IsString()
  @MaxLength(500)
  @Matches(/\S/)
  learnerAnswer!: string;

  @IsInt()
  @Min(1)
  attemptNumber!: number;
}
