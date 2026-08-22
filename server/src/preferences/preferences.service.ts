import { Injectable } from '@nestjs/common';
import { Grade, Pathway } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';

const gradeMap: Record<string, Grade> = {
  'lower-primary': Grade.lower_primary,
  'upper-primary': Grade.upper_primary,
  'junior-high': Grade.junior_high,
  'senior-high': Grade.senior_high,
};

const pathwayMap: Record<string, Pathway> = {
  'arts-sports': Pathway.arts_sports,
  'social-sciences': Pathway.social_sciences,
  stem: Pathway.stem,
};

const apiGradeMap: Record<Grade, string> = {
  [Grade.lower_primary]: 'lower-primary',
  [Grade.upper_primary]: 'upper-primary',
  [Grade.junior_high]: 'junior-high',
  [Grade.senior_high]: 'senior-high',
};

const apiPathwayMap: Record<Pathway, string> = {
  [Pathway.arts_sports]: 'arts-sports',
  [Pathway.social_sciences]: 'social-sciences',
  [Pathway.stem]: 'stem',
};

export interface UserPreferenceResponse {
  grade: string;
  subject: string;
  pathway?: string | null;
}

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<UserPreferenceResponse> {
    const preference = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    return normalizePreference(preference);
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferenceResponse> {
    const currentPreference = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    const nextGrade = dto.grade
      ? gradeMap[dto.grade]
      : currentPreference?.grade ?? Grade.lower_primary;
    const nextPathway = dto.pathway
      ? pathwayMap[dto.pathway]
      : currentPreference?.pathway ?? null;

    const normalizedSubject = dto.subject?.trim()
      ? dto.subject.trim()
      : currentPreference?.subject ?? 'math';

    const finalPathway = nextGrade === Grade.senior_high ? nextPathway : null;

    const preference = await this.prisma.userPreference.upsert({
      where: { userId },
      update: {
        grade: nextGrade,
        subject: normalizedSubject,
        pathway: finalPathway,
      },
      create: {
        userId,
        grade: nextGrade,
        subject: normalizedSubject,
        pathway: finalPathway,
      },
    });

    return normalizePreference(preference);
  }
}

function normalizePreference(
  preference: { grade: Grade; subject: string | null; pathway: Pathway | null } | null,
): UserPreferenceResponse {
  const grade = preference?.grade ?? Grade.lower_primary;
  const subject = preference?.subject ?? 'math';
  const pathway = preference?.pathway ? apiPathwayMap[preference.pathway] : undefined;

  return {
    grade: apiGradeMap[grade],
    subject,
    pathway,
  };
}