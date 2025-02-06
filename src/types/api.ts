export interface School {
  schoolName: string;
  schoolCode: number;
  region: string;
}

export interface ClassList {
  grade: number;
  classes: number[];
}

export interface Timetable {
  subject: string;
  teacher: string;
  changed: boolean;
  originalSubject?: string;
  originalTeacher?: string;
}
