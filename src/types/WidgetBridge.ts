export interface WidgetBridge {
  updateWidget(mealData: string): Promise<boolean>;
  forceUpdateWidget(): Promise<boolean>;
  saveSchoolInfo(schoolCode: string, regionCode: string): Promise<boolean>;
  saveTimetableInfo(comciganSchoolCode: string, grade: number, classNum: number): Promise<boolean>;
  getSchoolInfo(): Promise<{schoolCode: string | null; regionCode: string | null}>;
}

export interface SchoolInfo {
  schoolCode: string | null;
  regionCode: string | null;
}