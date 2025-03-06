import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  timetableRow: {
    flexDirection: 'row',
    gap: 3,
  },
  timetableCell: {
    flex: 1,
    paddingHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfoText: {
    marginTop: 4,
  },
});
