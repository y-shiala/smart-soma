import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'pathwayGrade', async: false })
class PathwayGradeConstraint implements ValidatorConstraintInterface {
  validate(pathway: string | undefined, args?: ValidationArguments): boolean {
    return (
      pathway === undefined ||
      (args?.object as RegisterDto | undefined)?.grade === 'senior-high'
    );
  }

  defaultMessage(): string {
    return 'pathway can only be used with senior-high';
  }
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/\S/, {
    message: 'displayName must contain non-whitespace characters',
  })
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
  @Validate(PathwayGradeConstraint)
  pathway?: string;
}
