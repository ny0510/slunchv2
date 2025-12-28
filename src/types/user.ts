export interface UserSchoolInfo {
  schoolName: string;
  comciganCode: number;
  comciganRegion: string;
  neisCode: number;
  neisRegion: string;
  neisRegionCode: string;
}

export interface UserClassInfo {
  grade: string;
  class: string;
}

export interface CardData {
  id: 'schedule' | 'meal' | 'timetable' | 'grade-timetable';
  title: string;
  iconName: string;
  visible: boolean;
}
