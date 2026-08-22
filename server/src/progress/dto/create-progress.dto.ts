import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  @MaxLength(500)
  @Matches(/\S/, {
    message: 'question must contain non-whitespace characters',
  })
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @IsIn(['lower-primary', 'upper-primary', 'junior-high', 'senior-high'])
  grade?: string;
}