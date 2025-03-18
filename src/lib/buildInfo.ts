import dayjs from 'dayjs';
import DeviceInfo from 'react-native-device-info';

export const appVersion = DeviceInfo.getVersion();
export const appBuildNumber = DeviceInfo.getBuildNumber();
export const buildDate = dayjs('2025-03-19');
