import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { AxiosAdapter, CreateAxiosDefaults } from 'axios';
import { TextInput, TouchableOpacity } from 'react-native';

const axios = require('axios');
const requestAttempts: string[] = [];
const originalAxiosAdapter = axios.defaults.adapter;
const originalAxiosCreate = axios.create;
const originalFetch = global.fetch;

const guardedAxiosAdapter: AxiosAdapter = async config => {
  const url = String(config.url ?? '');
  requestAttempts.push(url);
  throw new Error(`Unexpected network request: ${url}`);
};

axios.defaults.adapter = guardedAxiosAdapter;
jest.spyOn(axios, 'create').mockImplementation((...args: unknown[]) => {
  const client = originalAxiosCreate(args[0] as CreateAxiosDefaults | undefined);
  client.defaults.adapter = guardedAxiosAdapter;
  return client;
});
global.fetch = ((input: RequestInfo | URL) => {
  const url = String(input);
  requestAttempts.push(url);
  throw new Error(`Unexpected network request: ${url}`);
}) as unknown as typeof fetch;

const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { SafeAreaProvider } = require('react-native-safe-area-context');
const { ThemeProvider } = require('../src/contexts/ThemeContext');
const App = require('../src/App').default;
const { IntroScreen, SchoolSearchScreen } = require('../src/screens/Onboarding');

test('first-open onboarding navigates from intro to school search', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  let fakeTimersEnabled = false;

  try {
    await AsyncStorage.clear();
    requestAttempts.length = 0;
    jest.useFakeTimers();
    fakeTimersEnabled = true;
    jest.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(renderer!.root.findByType(IntroScreen)).toBeTruthy();
    const startButton = renderer!.root.find(node =>
      node.type === TouchableOpacity && node.findAll(child => child.props.children === '시작하기').length > 0,
    );
    expect(startButton.type).toBe(TouchableOpacity);

    await ReactTestRenderer.act(async () => {
      startButton!.props.onPress();
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(renderer!.root.findByType(SchoolSearchScreen)).toBeTruthy();
    const schoolInput = renderer!.root
      .findAllByType(TextInput)
      .find(({ props }) => props.placeholder === '학교명을 입력하세요');
    expect(schoolInput).toBeDefined();
    expect(schoolInput!.props.value).toBe('');
    expect(requestAttempts).toEqual([]);
  } finally {
    try {
      if (renderer) {
        await ReactTestRenderer.act(async () => {
          renderer!.unmount();
        });
      }
    } finally {
      try {
        jest.restoreAllMocks();
      } finally {
        if (fakeTimersEnabled) {
          jest.clearAllTimers();
          jest.useRealTimers();
        }
        axios.defaults.adapter = originalAxiosAdapter;
        global.fetch = originalFetch;
        await AsyncStorage.clear();
      }
    }
  }
});
