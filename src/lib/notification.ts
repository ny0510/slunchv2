import {theme} from '@/styles/theme';
import notifee, {AndroidImportance} from '@notifee/react-native';

export const sendNotification = async (title: string | undefined, body: string | undefined) => {
  if (!title || !body) {
    return;
  }

  const channelId = await notifee.createChannel({
    id: 'meal',
    name: '급식 알림',
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
      color: theme.colors.highlight,
    },
  });
};
