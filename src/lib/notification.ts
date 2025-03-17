import notifee from '@notifee/react-native';

export const sendNotification = async (title: string = '', body: string = '') => {
  const channelId = await notifee.createChannel({
    id: 'meal',
    name: '급식 알림',
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
    },
  });
};
