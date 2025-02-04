import httpClient from './httpClient';
import {ApiResponse, ClassList, School} from '@/types/api';

export const searchSchool = async (schoolName: string): Promise<School[]> => {
  const response = await httpClient.get<ApiResponse>(`/comcigan/search?school_name=${schoolName}`);
  return response.data.data;
};

export const getClassList = async (schoolName: string, schoolCode: number): Promise<ClassList> => {
  const response = await httpClient.get<ApiResponse>(`/comcigan/classlist?school_name=${schoolName}&school_code=${schoolCode}`);
  return response.data.data;
};
