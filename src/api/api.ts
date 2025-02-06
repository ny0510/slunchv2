import httpClient from './httpClient';
import {ClassList, School, Timetable} from '@/types/api';

export const searchSchool = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get(`/school/search?schoolName=${schoolName}`);
  return response.data;
};

export const getClassList = async (schoolCode: number): Promise<ClassList[]> => {
  const response = await httpClient.get(`/school/classList?schoolCode=${schoolCode}`);
  return response.data;
};

export const getTimetable = async (schoolCode: number, grade: number, classNum: number): Promise<Timetable[][]> => {
  const response = await httpClient.get(`/school/timetable?schoolCode=${schoolCode}&grade=${grade}&class=${classNum}`);
  return response.data;
};
