import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PermissionsAndroid, Platform } from 'react-native';

import ShareScreen from './Share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { showToast } from '@/lib/toast';

jest.mock('@/components/Container', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => React.createElement(View, props, children);
});
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      background: '#fff',
      card: '#eee',
      highlight: '#f00',
      highlightLight: '#fcc',
      primaryText: '#000',
      secondaryText: '#666',
    },
    typography: { body: {}, caption: {}, subtitle: {} },
  }),
}));
jest.mock('@/lib/toast', () => ({ showToast: jest.fn() }));
jest.mock('react-native-touchable-scale', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => {
    const hasSaveLabel = (node: unknown): boolean => {
      if (Array.isArray(node)) return node.some(hasSaveLabel);
      if (!React.isValidElement(node)) return node === '저장';
      return hasSaveLabel(node.props.children);
    };
    return React.createElement(View, { ...props, testID: hasSaveLabel(children) ? 'share-save-button' : 'share-touchable' }, children);
  };
});
jest.mock('react-native-view-shot', () => {
  const React = require('react');
  const { View } = require('react-native');
  const capture = jest.fn();
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({ capture }));
      return React.createElement(View, props, props.children);
    }),
    __capture: capture,
  };
});
jest.mock('@react-native-camera-roll/camera-roll', () => ({ CameraRoll: { saveAsset: jest.fn() } }));
jest.mock('@react-native-firebase/analytics', () => ({ getAnalytics: jest.fn(() => ({})), logEvent: jest.fn() }));
jest.mock('@react-native-vector-icons/fontawesome6', () => 'FontAwesome6');
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn(), shareSingle: jest.fn() },
  Social: { InstagramStories: 'instagram-stories' },
}));

const mockCapture = require('react-native-view-shot').__capture as jest.Mock;
const cameraRollSaveAsset = CameraRoll.saveAsset as jest.Mock;
const showToastMock = showToast as jest.Mock;
const originalPlatformOS = Object.getOwnPropertyDescriptor(Platform, 'OS');
const originalPlatformVersion = Object.getOwnPropertyDescriptor(Platform, 'Version');
const route = {
  params: {
    data: {
      school: '테스트학교',
      date: '2026-09-27',
      meal: '밥\n국',
    },
  },
} as never;

let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
let checkPermission: jest.SpyInstance;
let requestPermission: jest.SpyInstance;
let requestMultiplePermissions: jest.SpyInstance;

const useAndroidVersion = (version: string | number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version });
};

const saveFromScreen = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<ShareScreen route={route} navigation={{} as never} />);
  });

  const saveButton = renderer!.root.findByProps({ testID: 'share-save-button' });

  await ReactTestRenderer.act(async () => {
    await saveButton.props.onPress();
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCapture.mockResolvedValue('/tmp/meal.png');
  cameraRollSaveAsset.mockResolvedValue(undefined);
  checkPermission = jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
  requestPermission = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
  requestMultiplePermissions = jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({} as never);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  try {
    if (renderer) {
      await ReactTestRenderer.act(async () => {
        renderer!.unmount();
      });
      renderer = undefined;
    }
  } finally {
    if (originalPlatformOS) {
      Object.defineProperty(Platform, 'OS', originalPlatformOS);
    }
    if (originalPlatformVersion) {
      Object.defineProperty(Platform, 'Version', originalPlatformVersion);
    }
    jest.restoreAllMocks();
  }
});

describe('Share screen save permissions', () => {
  it('saves on Android API 28 when WRITE_EXTERNAL_STORAGE is already granted', async () => {
    useAndroidVersion(28);
    checkPermission.mockResolvedValue(true);

    await saveFromScreen();

    expect(checkPermission).toHaveBeenCalledTimes(1);
    expect(checkPermission).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    expect(requestMultiplePermissions).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(cameraRollSaveAsset).toHaveBeenCalledWith('file:///tmp/meal.png', { type: 'photo' });
    expect(showToastMock).toHaveBeenCalledWith('갤러리에 저장되었어요.');
  });

  it('requests WRITE_EXTERNAL_STORAGE and saves when Android API 28 grants it', async () => {
    useAndroidVersion(28);
    checkPermission.mockResolvedValue(false);
    requestPermission.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

    await saveFromScreen();

    expect(checkPermission).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    expect(checkPermission).toHaveBeenCalledTimes(1);
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(requestPermission).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    expect(requestMultiplePermissions).not.toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(cameraRollSaveAsset).toHaveBeenCalledTimes(1);
    expect(showToastMock).toHaveBeenCalledWith('갤러리에 저장되었어요.');
  });

  it.each([
    ['denied', PermissionsAndroid.RESULTS.DENIED],
    ['never_ask_again', PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN],
  ])('does not capture or save on Android API 28 when permission is %s', async (_label, status) => {
    useAndroidVersion(28);
    checkPermission.mockResolvedValue(false);
    requestPermission.mockResolvedValue(status);

    await saveFromScreen();

    expect(checkPermission).toHaveBeenCalledTimes(1);
    expect(checkPermission).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    expect(requestMultiplePermissions).not.toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(mockCapture).not.toHaveBeenCalled();
    expect(cameraRollSaveAsset).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith('저장 권한이 필요해요.');
  });

  it.each([29, 32, 33, 36])('saves on Android API %s without calling permission APIs', async version => {
    useAndroidVersion(version);
    checkPermission.mockRejectedValue(new Error('Unexpected permission check'));
    requestMultiplePermissions.mockRejectedValue(new Error('Unexpected multiple permission request'));
    requestPermission.mockRejectedValue(new Error('Unexpected permission request'));

    await saveFromScreen();

    expect(checkPermission).not.toHaveBeenCalled();
    expect(requestMultiplePermissions).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(cameraRollSaveAsset).toHaveBeenCalledTimes(1);
    expect(showToastMock).toHaveBeenCalledWith('갤러리에 저장되었어요.');
  });

  it('converts string API version 28 and checks the write permission', async () => {
    useAndroidVersion('28');
    checkPermission.mockResolvedValue(true);

    await saveFromScreen();

    expect(requestMultiplePermissions).not.toHaveBeenCalled();
    expect(checkPermission).toHaveBeenCalledTimes(1);
    expect(checkPermission).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    expect(requestPermission).not.toHaveBeenCalled();
    expect(cameraRollSaveAsset).toHaveBeenCalledTimes(1);
  });

  it('shows capture failure and does not save when ViewShot returns no image', async () => {
    useAndroidVersion(29);
    mockCapture.mockResolvedValue(undefined);

    await saveFromScreen();

    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(cameraRollSaveAsset).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith('이미지 캡처에 실패했어요.');
    expect(showToastMock).not.toHaveBeenCalledWith('갤러리에 저장되었어요.');
  });

  it('shows save failure when CameraRoll rejects', async () => {
    useAndroidVersion(29);
    cameraRollSaveAsset.mockRejectedValue(new Error('save failed'));

    await saveFromScreen();

    expect(cameraRollSaveAsset).toHaveBeenCalledTimes(1);
    expect(showToastMock).toHaveBeenCalledWith('이미지 저장에 실패했어요.');
    expect(showToastMock).not.toHaveBeenCalledWith('갤러리에 저장되었어요.');
  });
});
