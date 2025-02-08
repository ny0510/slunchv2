import httpClient from './httpClient';
import {ClassList, Meal, Schedule, School, Timetable} from '@/types/api';

export const comciganSchoolSearch = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get('/comcigan/search', {
    params: {schoolName},
  });
  return response.data;
};

export const getClassList = async (schoolCode: number): Promise<ClassList[]> => {
  const response = await httpClient.get('/comcigan/classList', {
    params: {schoolCode},
  });
  return response.data;
};

export const getTimetable = async (schoolCode: number, grade: number, classNum: number): Promise<Timetable[][]> => {
  const response = await httpClient.get('/comcigan/timetable', {
    params: {schoolCode, grade, class: classNum},
  });
  return response.data;
};

export const neisSchoolSearch = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get('/neis/search', {
    params: {schoolName},
  });
  return response.data;
};

export const getMeal = async (schoolCode: number, regionCode: string, year: string, month: string, day?: string, showAllergy: boolean = false, showOrigin: boolean = false, showNutrition: boolean = false): Promise<Meal[]> => {
  const response = await httpClient.get('/neis/meal', {
    params: {
      schoolCode,
      regionCode,
      year,
      month,
      day,
      showAllergy,
      showOrigin,
      showNutrition,
    },
  });

  return response.data;
};

export const getSchedules = async (schoolCode: number, regionCode: string, year: string, month: string, day?: string): Promise<Schedule[]> => {
  const response = await httpClient.get('/neis/schedule', {
    params: {schoolCode, regionCode, year, month, day},
  });
  return response.data;
};
