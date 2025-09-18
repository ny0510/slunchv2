import notifee, {AndroidImportance} from '@notifee/react-native';

export const sendNotification = async (title: string | undefined, body: string | undefined, type: 'meal' | 'timetable' = 'meal') => {
  if (!title || !body) {
    return;
  }

  const channelConfig = type === 'meal' ? {id: 'meal', name: '급식 알림'} : {id: 'timetable', name: '시간표 알림'};

  const channelId = await notifee.createChannel({
    ...channelConfig,
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      smallIcon: 'ic_launcher_round',
      pressAction: {
        id: 'default',
      },
      color: '#7956FC',
      timestamp: new Date().getTime(),
      showTimestamp: true,
    },
  });
};
