export interface ApiResponse {
  success: boolean;
  data: [];
}

export interface School {
  name: string;
  period: string;
  code: number;
}

export type ClassList = string[];
