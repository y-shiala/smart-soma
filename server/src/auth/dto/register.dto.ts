import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsIn(['lower-primary', 'upper-primary', 'junior-high', 'senior-high'])
  grade!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsIn(['arts-sports', 'social-sciences', 'stem'])
  pathway?: string;
}
