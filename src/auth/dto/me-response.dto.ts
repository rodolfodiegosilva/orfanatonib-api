import { UserRole } from "../auth.types";

export type ChelterLite = {
  id: string;
  number: number;
  weekday: string;
};

export type TeacherProfileLite = {
  id: string;
  active: boolean;
  club: ChelterLite | null;
};

export type CoordinatorProfileLite = {
  id: string;
  active: boolean;
  clubs: ChelterLite[];
};

export class MeResponseDto {
  id!: string;
  email!: string;
  phone!: string;
  name!: string;
  active!: boolean;
  completed!: boolean;
  commonUser!: boolean;
  role!: UserRole;

  teacherProfile!: TeacherProfileLite | null;
  leaderProfile!: CoordinatorProfileLite | null;
}
