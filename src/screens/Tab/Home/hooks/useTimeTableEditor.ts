import {useCallback, useRef, useState} from 'react';

import {getTimetable} from '@/api';
import {useUser} from '@/contexts/UserContext';
import {StorageHelper, STORAGE_KEYS} from '@/lib/storage';
import {showToast} from '@/lib/toast';
import {Timetable} from '@/types/api';
import BottomSheet from '@gorhom/bottom-sheet';
import analytics from '@react-native-firebase/analytics';

export const useTimeTableEditor = (
  timetable: Timetable[][],
  onTimetableUpdate: (newTimetable: Timetable[][]) => void,
) => {
  const [selectedSubject, setSelectedSubject] = useState<Timetable | null>(null);
  const [selectedSubjectIndices, setSelectedSubjectIndices] = useState<{row: number; col: number} | null>(null);
  const [tempSubject, setTempSubject] = useState<{subject: string; teacher: string} | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {schoolInfo, classInfo} = useUser();

  // 과목 선택 핸들러
  const handleSubjectSelect = useCallback(
    (subject: Timetable, row: number, col: number) => {
      setSelectedSubject(subject);
      setSelectedSubjectIndices({row, col});
      setTempSubject({subject: subject.subject, teacher: subject.teacher});
      bottomSheetRef.current?.expand();

      // 분석 이벤트 로그
      analytics().logEvent('timetable_subject_select', {
        subject: subject.subject,
        teacher: subject.teacher,
        row: row.toString(),
        col: col.toString(),
      });
    },
    [],
  );

  // 임시 과목 정보 업데이트 (실시간 입력용)
  const updateTempSubject = useCallback(
    (newSubject: string, newTeacher: string) => {
      setTempSubject({subject: newSubject, teacher: newTeacher});
    },
    [],
  );

  // 과목 정보 저장 (BottomSheet 닫힐 때)
  const saveSubject = useCallback(
    async () => {
      if (!selectedSubjectIndices || !tempSubject) return;

      const {row, col} = selectedSubjectIndices;
      const updatedTimetable = [...timetable];

      // 새로운 과목 정보로 업데이트
      updatedTimetable[row][col] = {
        ...updatedTimetable[row][col],
        subject: tempSubject.subject,
        teacher: tempSubject.teacher,
        userChanged: true, // 사용자가 변경했음을 표시
      };

      // 상태 업데이트
      onTimetableUpdate(updatedTimetable);

      // 로컬 스토리지에 저장
      try {
        await StorageHelper.setItem(STORAGE_KEYS.CACHED_TIMETABLE, updatedTimetable);
        showToast('시간표가 변경되었어요.');

        // 분석 이벤트 로그
        analytics().logEvent('timetable_subject_update', {
          old_subject: selectedSubject?.subject,
          new_subject: tempSubject.subject,
          old_teacher: selectedSubject?.teacher,
          new_teacher: tempSubject.teacher,
          row: row.toString(),
          col: col.toString(),
        });
      } catch (error) {
        console.error('Error saving timetable:', error);
        showToast('시간표 저장에 실패했습니다');
      }
    },
    [timetable, selectedSubjectIndices, selectedSubject, tempSubject, onTimetableUpdate],
  );

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

  // 과목 정보 초기화 (원본으로 복원)
  const resetSubject = useCallback(async () => {
    if (!selectedSubjectIndices || !schoolInfo || !classInfo) return;

    const {row, col} = selectedSubjectIndices;
    
    try {
      // API에서 원본 시간표 가져오기
      const originalData = await getTimetable(
        schoolInfo.comciganCode,
        parseInt(classInfo.grade),
        parseInt(classInfo.class)
      );
      
      // 시간표 전치
      const originalTimetable = transposeTimeTable(originalData);
      
      if (originalTimetable?.[row]?.[col]) {
        const updatedTimetable = [...timetable];
        // 원본으로 복원
        updatedTimetable[row][col] = {
          ...originalTimetable[row][col],
          userChanged: false,
        };
        
        // 임시 상태도 원본으로 업데이트
        setTempSubject({
          subject: originalTimetable[row][col].subject,
          teacher: originalTimetable[row][col].teacher,
        });
        setSelectedSubject(originalTimetable[row][col]);
        
        onTimetableUpdate(updatedTimetable);
        
        await StorageHelper.setItem(STORAGE_KEYS.CACHED_TIMETABLE, updatedTimetable);
        showToast('원본 시간표로 복원되었습니다');

        // 분석 이벤트 로그
        analytics().logEvent('timetable_subject_reset', {
          subject: selectedSubject?.subject,
          teacher: selectedSubject?.teacher,
          row: row.toString(),
          col: col.toString(),
        });
        
        // BottomSheet 닫기
        bottomSheetRef.current?.close();
      } else {
        showToast('원본 시간표를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('Error resetting subject:', error);
      showToast('시간표 복원에 실패했습니다');
    }
  }, [timetable, selectedSubjectIndices, selectedSubject, schoolInfo, classInfo, onTimetableUpdate, transposeTimeTable]);

  // 바텀시트 닫기
  const closeBottomSheet = useCallback(() => {
    setSelectedSubject(null);
    setSelectedSubjectIndices(null);
    setTempSubject(null);
    bottomSheetRef.current?.close();
  }, []);

  return {
    selectedSubject,
    selectedSubjectIndices,
    tempSubject,
    bottomSheetRef,
    handleSubjectSelect,
    updateTempSubject,
    saveSubject,
    resetSubject,
    closeBottomSheet,
  };
};