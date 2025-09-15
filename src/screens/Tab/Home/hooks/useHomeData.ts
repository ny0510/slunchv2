import dayjs from 'dayjs';
import {useCallback, useEffect, useReducer, useState} from 'react';

import {getMeal, getSchedules, getTimetable} from '@/api';
import {useUser} from '@/contexts/UserContext';
import {StorageHelper, STORAGE_KEYS} from '@/lib/storage';
import {showToast} from '@/lib/toast';
import {Meal, Schedule, Timetable} from '@/types/api';

// 상태 타입 정의
interface HomeDataState {
  timetable: Timetable[][];
  meal: Meal[];
  schedules: Schedule[];
  loading: boolean;
  refreshing: boolean;
  showAllergy: boolean;
  todayIndex: number;
  mealDayOffset: number;
}

// 액션 타입 정의
type HomeDataAction =
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_REFRESHING'; payload: boolean}
  | {type: 'SET_TIMETABLE'; payload: Timetable[][]}
  | {type: 'SET_MEAL'; payload: Meal[]}
  | {type: 'SET_SCHEDULES'; payload: Schedule[]}
  | {type: 'SET_SHOW_ALLERGY'; payload: boolean}
  | {type: 'SET_TODAY_INDEX'; payload: number}
  | {type: 'SET_MEAL_DAY_OFFSET'; payload: number}
  | {type: 'RESET_STATE'};

// 초기 상태
const initialState: HomeDataState = {
  timetable: [],
  meal: [],
  schedules: [],
  loading: true,
  refreshing: false,
  showAllergy: true,
  todayIndex: dayjs().day() - 1,
  mealDayOffset: 0,
};

// 리듀서 함수
const homeDataReducer = (state: HomeDataState, action: HomeDataAction): HomeDataState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {...state, loading: action.payload};
    case 'SET_REFRESHING':
      return {...state, refreshing: action.payload};
    case 'SET_TIMETABLE':
      return {...state, timetable: action.payload};
    case 'SET_MEAL':
      return {...state, meal: action.payload};
    case 'SET_SCHEDULES':
      return {...state, schedules: action.payload};
    case 'SET_SHOW_ALLERGY':
      return {...state, showAllergy: action.payload};
    case 'SET_TODAY_INDEX':
      return {...state, todayIndex: action.payload};
    case 'SET_MEAL_DAY_OFFSET':
      return {...state, mealDayOffset: action.payload};
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

// 설정 인터페이스
interface Settings {
  showAllergy?: boolean;
}

export const useHomeData = () => {
  const [state, dispatch] = useReducer(homeDataReducer, initialState);
  const [midnightTrigger, setMidnightTrigger] = useState(false);
  const {schoolInfo, classInfo, classChangedTrigger, setClassChangedTrigger} = useUser();

  // 시간표 전치 (transpose) 함수
  const transposeTimeTable = useCallback((array: Timetable[][]): Timetable[][] => {
    const maxColLength = Math.max(...array.map(row => row.length));
    return Array.from({length: maxColLength}, (_, colIndex) =>
      array.map(row => {
        const entry = row[colIndex];
        if (!entry) {
          return {subject: '-', teacher: '-', changed: false};
        }
        return {
          ...entry,
          subject: entry.subject === '없음' ? '-' : entry.subject,
          teacher: entry.teacher === '없음' ? '-' : entry.teacher,
        };
      }),
    );
  }, []);

  // 메인 데이터 가져오기 함수
  const fetchData = useCallback(async (showAllergy?: boolean): Promise<void> => {
    dispatch({type: 'SET_LOADING', payload: true});
    
    // 설정 불러오기 및 showAllergy 값 가져오기
    const settings = await StorageHelper.getItem<Settings>(STORAGE_KEYS.SETTINGS, {});
    const allergyPreference = showAllergy ?? settings.showAllergy ?? true;
    dispatch({type: 'SET_SHOW_ALLERGY', payload: allergyPreference});

    try {
      const today = dayjs();
      
      if (!schoolInfo || !classInfo) {
        console.warn('School info or class info not available');
        return;
      }

      // Promise.allSettled를 사용하여 병렬 처리
      const [timetableResult, mealResult, scheduleResult] = await Promise.allSettled([
        getTimetable(schoolInfo.comciganCode, parseInt(classInfo.grade), parseInt(classInfo.class)),
        getMeal(
          schoolInfo.neisCode,
          schoolInfo.neisRegionCode,
          parseInt(today.format('YYYY')),
          parseInt(today.format('MM')),
          parseInt(today.format('DD')),
          allergyPreference,
          true,
          true,
        ),
        getSchedules(schoolInfo.neisCode, schoolInfo.neisRegionCode, parseInt(today.format('YYYY')), parseInt(today.format('MM'))),
      ]);

      // 시간표 처리
      if (timetableResult.status === 'fulfilled') {
        const newTimetable = transposeTimeTable(timetableResult.value);

        // 기존 커스텀 시간표 확인
        const existingCustomTimetable = await StorageHelper.getItem<Timetable[][] | null>(
          STORAGE_KEYS.CACHED_TIMETABLE,
          null,
        );

        if (existingCustomTimetable) {
          // 사용자가 변경한 항목만 보존
          const mergedTimetable = newTimetable.map((row, rowIndex) =>
            row.map((subject, colIndex) => {
              const existingSubject = existingCustomTimetable[rowIndex]?.[colIndex];
              // userChanged가 true인 항목만 보존
              if (existingSubject && 'userChanged' in existingSubject && existingSubject.userChanged) {
                return existingSubject;
              }
              return subject;
            }),
          );
          dispatch({type: 'SET_TIMETABLE', payload: mergedTimetable});
        } else {
          dispatch({type: 'SET_TIMETABLE', payload: newTimetable});
        }
      } else {
        console.error('Error fetching timetable:', timetableResult.reason);
        // 521 오류 체크
        if (timetableResult.reason?.response?.status === 521) {
          showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }

      // 급식 처리
      if (mealResult.status === 'fulfilled') {
        dispatch({type: 'SET_MEAL', payload: mealResult.value});
      } else {
        console.error('Error fetching meal:', mealResult.reason);
        if (mealResult.reason?.response?.status === 521) {
          showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }

      // 일정 처리
      if (scheduleResult.status === 'fulfilled') {
        dispatch({type: 'SET_SCHEDULES', payload: scheduleResult.value});
      } else {
        console.error('Error fetching schedules:', scheduleResult.reason);
        if (scheduleResult.reason?.response?.status === 521) {
          showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      dispatch({type: 'SET_LOADING', payload: false});
      dispatch({type: 'SET_REFRESHING', payload: false});
    }
  }, [schoolInfo, classInfo, transposeTimeTable]);

  // 새로고침 함수
  const handleRefresh = useCallback(async (): Promise<void> => {
    dispatch({type: 'SET_REFRESHING', payload: true});
    await fetchData();
  }, [fetchData]);

  // 자정 트리거 처리
  useEffect(() => {
    if (midnightTrigger) {
      dispatch({type: 'SET_TODAY_INDEX', payload: dayjs().day() - 1});
      setMidnightTrigger(false);
    }
  }, [midnightTrigger]);

  // 클래스 변경 트리거 처리
  useEffect(() => {
    if (classChangedTrigger) {
      fetchData();
      setClassChangedTrigger(false);
    }
  }, [classChangedTrigger, fetchData, setClassChangedTrigger]);

  // 초기 데이터 로드
  useEffect(() => {
    if (schoolInfo && classInfo) {
      fetchData();
    }
  }, [schoolInfo, classInfo]); // fetchData를 의존성에 추가하면 무한 루프가 될 수 있으므로 조건부로 실행

  return {
    ...state,
    midnightTrigger,
    setMidnightTrigger,
    fetchData,
    handleRefresh,
    dispatch,
  };
};