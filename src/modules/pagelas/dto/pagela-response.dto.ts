import { PagelaEntity } from '../entities/pagela.entity';

export class PagelaResponseDto {
  id: string;
  createdAt: string;
  updatedAt: string;

  shelteredId: string;
  teacherProfileId: string;

  referenceDate: string;
  year: number;
  visit: number;

  present: boolean;
  notes: string | null;

  static fromEntity(e: PagelaEntity): PagelaResponseDto {
    return {
      id: e.id,
      createdAt: (e as any).createdAt?.toISOString?.() ?? (e as any).createdAt,
      updatedAt: (e as any).updatedAt?.toISOString?.() ?? (e as any).updatedAt,
      shelteredId: e.sheltered?.id,
      teacherProfileId: e.teacher?.id,
      referenceDate: e.referenceDate,
      year: e.year,
      visit: e.visit,
      present: e.present,
      notes: e.notes ?? null,
    };
  }
}
