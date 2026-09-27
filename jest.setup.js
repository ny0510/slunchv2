
global.fetch = jest.fn(() => Promise.reject(new Error('Unexpected network request in onboarding smoke')));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-reanimated/src/initializers.native', () => ({
  initializeReanimatedModule: jest.fn(),
}));
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@notifee/react-native', () => {
  const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2, EPHEMERAL: 3 };
  return {
    __esModule: true,
    AuthorizationStatus,
    AndroidImportance: { HIGH: 4 },
    default: {
      requestPermission: jest.fn(async () => ({ authorizationStatus: AuthorizationStatus.AUTHORIZED })),
      createChannel: jest.fn(async channel => channel.id),
      displayNotification: jest.fn(async () => undefined),
    },
  };
});
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('@react-native-clipboard/clipboard', () =>
  require('@react-native-clipboard/clipboard/jest/clipboard-mock'),
);
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

jest.mock('@react-native-firebase/auth', () => {
  const auth = {};
  let active = true;
  return {
    getAuth: jest.fn(() => auth),
    onAuthStateChanged: jest.fn((_auth, listener) => {
      active = true;
      Promise.resolve().then(() => active && listener(null));
      return () => {
        active = false;
      };
    }),
    signInWithCredential: jest.fn(() => {
      throw new Error('Unexpected native call in onboarding smoke: auth.signInWithCredential');
    }),
    signOut: jest.fn(() => {
      throw new Error('Unexpected native call in onboarding smoke: auth.signOut');
    }),
    GoogleAuthProvider: {
      credential: jest.fn(() => {
        throw new Error('Unexpected native call in onboarding smoke: auth.GoogleAuthProvider.credential');
      }),
    },
  };
});
jest.mock('@react-native-firebase/messaging', () => {
  const messaging = {};
  return {
    getMessaging: jest.fn(() => messaging),
    onMessage: jest.fn(() => jest.fn()),
    getToken: jest.fn(() => {
      throw new Error('Unexpected native call in onboarding smoke: messaging.getToken');
    }),
    registerDeviceForRemoteMessages: jest.fn(() => {
      throw new Error('Unexpected native call in onboarding smoke: messaging.registerDeviceForRemoteMessages');
    }),
  };
});
jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(),
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => {
      throw new Error('Unexpected native call in onboarding smoke: GoogleSignin.hasPlayServices');
    }),
    signIn: jest.fn(() => {
      throw new Error('Unexpected native call in onboarding smoke: GoogleSignin.signIn');
    }),
    getTokens: jest.fn(() => {
      throw new Error('Unexpected native call in onboarding smoke: GoogleSignin.getTokens');
    }),
  },
}));
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  mobileReplayIntegration: jest.fn(() => ({})),
  wrap: component => component,
}));
jest.mock('react-native-version-check', () => ({
  __esModule: true,
  default: {
    needUpdate: jest.fn(async () => ({ isNeeded: false })),
    getCurrentVersion: jest.fn(async () => '0.0.0-test'),
    getCurrentBuildNumber: jest.fn(async () => '0'),
  },
}));
jest.mock('react-native-splash-view', () => ({
  showSplash: jest.fn(),
  hideSplash: jest.fn(),
}));
jest.mock('@react-native-vector-icons/fontawesome6', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(({ children, ...props }, ref) => (
      <Text ref={ref} {...props}>
        {children}
      </Text>
    )),
  };
});
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(({ children, ...props }, ref) => (
      <View ref={ref} {...props}>
        {children}
      </View>
    )),
  };
});

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {
    open: jest.fn(() => Promise.reject(new Error('Unexpected native call in onboarding smoke: Share.open'))),
    shareSingle: jest.fn(() => Promise.reject(new Error('Unexpected native call in onboarding smoke: Share.shareSingle'))),
  },
  Social: { InstagramStories: 'instagram-stories' },
}));
jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    saveAsset: jest.fn(() => Promise.reject(new Error('Unexpected native call in onboarding smoke: CameraRoll.saveAsset'))),
  },
}));
jest.mock('@reeq/react-native-device-brightness', () => ({
  getBrightnessLevel: jest.fn(() => {
    throw new Error('Unexpected native call in onboarding smoke: brightness.getBrightnessLevel');
  }),
  setBrightnessLevel: jest.fn(() => {
    throw new Error('Unexpected native call in onboarding smoke: brightness.setBrightnessLevel');
  }),
}));
jest.mock('@sayem314/react-native-keep-awake', () => ({
  activateKeepAwake: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));
jest.mock('react-native-date-picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => <View ref={ref} {...props} />),
  };
});
jest.mock('react-native-view-shot', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        capture: () => Promise.reject(new Error('Unexpected native call in onboarding smoke: ViewShot.capture')),
      }));
      return <View ref={ref} {...props} />;
    }),
  };
});
jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { View } = require('react-native');
  const host = name => React.forwardRef(({ children, ...props }, ref) => (
    <View ref={ref} {...props} testID={props.testID || name}>
      {children}
    </View>
  ));
  return {
    __esModule: true,
    default: { initialize: jest.fn() },
    BannerAd: host('BannerAd'),
    NativeAdView: host('NativeAdView'),
    NativeAsset: host('NativeAsset'),
    NativeAssetType: { ADVERTISER: 'advertiser', BODY: 'body', CALL_TO_ACTION: 'callToAction', HEADLINE: 'headline', PRICE: 'price', STORE: 'store', STAR_RATING: 'starRating', ICON: 'icon', IMAGE: 'image' },
    NativeAd: { createForAdRequest: jest.fn(() => Promise.reject(new Error('Unexpected native call in onboarding smoke: NativeAd.createForAdRequest'))) },
    BannerAdSize: { BANNER: 'BANNER', FULL_BANNER: 'FULL_BANNER' },
    TestIds: { BANNER: 'test-banner', NATIVE: 'test-native' },
    NativeAdChoicesPlacement: { TOP_LEFT: 0, TOP_RIGHT: 1, BOTTOM_RIGHT: 2, BOTTOM_LEFT: 3 },
    NativeMediaAspectRatio: { ANY: 0, LANDSCAPE: 1, PORTRAIT: 2, SQUARE: 3 },
    useForeground: jest.fn(),
  };
});
jest.mock('react-native-tracking-transparency', () => ({
  getTrackingStatus: jest.fn(async () => 'unavailable'),
  requestTrackingPermission: jest.fn(async () => 'unavailable'),
}));
jest.mock('@zoontek/react-native-navigation-bar', () => ({
  NavigationBar: () => null,
}));
jest.mock('react-native-svg', () => require('./test/fixtures/svg'));

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
