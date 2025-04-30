import {MealItem, MealOrigin, Mealnutrition} from './meal';

export interface School {
  schoolName: string;
  schoolCode: number | string;
  region: string;
  regionCode?: number;
}

export interface ClassList {
  grade: number;
  classes: number[];
}

export interface Timetable {
  subject: string;
  teacher: string;
  changed: boolean;
  userChanged?: boolean;
  originalSubject?: string;
  originalTeacher?: string;
}

export interface Meal {
  date: string;
  meal: (string | MealItem)[];
  type?: string;
  origin?: MealOrigin[];
  nutrition?: Mealnutrition[];
}

export interface Schedule {
  date: {
    start: string;
    end: string;
  };
  schedule: string;
}

export interface Notification {
  id: string;
  title: string;
  date: string;
  content: string;
}
