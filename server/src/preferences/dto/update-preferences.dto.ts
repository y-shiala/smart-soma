import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
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
      pathway === null ||
      (args?.object as UpdatePreferencesDto | undefined)?.grade === 'senior-high'
    );
  }

  defaultMessage(): string {
    return 'pathway can only be used with senior-high';
  }
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(['lower-primary', 'upper-primary', 'junior-high', 'senior-high'])
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @IsIn(['arts-sports', 'social-sciences', 'stem'])
  @Validate(PathwayGradeConstraint)
  pathway?: string;
}