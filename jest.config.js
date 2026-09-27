const preset = require('@react-native/jest-preset/jest-preset');

module.exports = {
  preset: '@react-native/jest-preset',
  resolver: preset.resolver,
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '^@env$': '<rootDir>/test/fixtures/env.js',
    '\\.svg$': '<rootDir>/test/fixtures/svg.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(?:-[^/]+)?|@react-native(?:-[^/]+)?|@react-navigation|@notifee|@sentry/react-native|@gorhom|@quidone|@reeq|@zoontek|@sayem314|nanoid|jsbarcode|react-native-svg)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
