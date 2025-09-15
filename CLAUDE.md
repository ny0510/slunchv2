# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application for "NYL, aka 선린급식" (Sunrin School Meal), a Korean school meal scheduling and information app. The app uses TypeScript and follows React Native best practices with modern libraries and patterns.

## Development Commands

### Starting the Application

- `bun start` - Start Metro bundler
- `bun run start:reset` - Start Metro with cache reset
- `bun run android` - Run on Android device/emulator (active arch only)
- `bun run ios` - Run on iOS device/simulator

### Platform-specific Commands

**Android:**

- `bun run android:clean` - Clean Android build
- `bun run android:assemble` - Build release APK
- `bun run android:bundle` - Build release AAB

**iOS:**

- `bun run ios:pod` - Install/update CocoaPods dependencies
- `bun run ios:pod:clean` - Remove CocoaPods integration
- `bun run ios:xcode` - Open Xcode workspace

### Code Quality

- `bun run lint` - Run ESLint
- `bun test` - Run Jest tests

## Project Architecture

### Directory Structure

- `src/` - Main source code
  - `components/` - Reusable UI components
  - `screens/` - Screen components organized by feature
    - `Tab/` - Tab-based screens
    - `Meal/` - Meal-related screens
    - `Schedules/` - Schedule screens
    - `Onboarding/` - Onboarding flow
  - `navigation/` - Navigation configuration
  - `contexts/` - React contexts (Theme, Auth, User)
  - `hooks/` - Custom React hooks
  - `api/` - API layer and services
  - `lib/` - Utility libraries
  - `types/` - TypeScript type definitions
  - `theme/` - Theme configuration and styling
  - `assets/` - Static assets (images, fonts)

### Key Technologies

- **React Native 0.78.2** with React 19.0.0
- **TypeScript** with path mapping (`@/*` → `src/*`)
- **Navigation**: React Navigation v7 (stack + bottom tabs)
- **State Management**: React Context (Theme, Auth, User)
- **Firebase**: Analytics, Auth, Messaging
- **UI Libraries**: React Native Reanimated, Gesture Handler, Bottom Sheet
- **Development**: ESLint, Prettier with import sorting, Jest

### Code Style

- Uses Prettier with custom config:
  - 300 character line width
  - Single quotes, no trailing semicolons
  - Import sorting with `@trivago/prettier-plugin-sort-imports`
- ESLint extends `@react-native` with inline styles allowed
- Path alias `@/` points to `src/`

### Key Features

- Dark/light theme support with context
- Firebase analytics and push notifications
- Google Mobile Ads integration
- App tracking transparency (iOS)
- Sentry error tracking
- Version checking and maintenance alerts

### Environment

- Uses `.env` file with `react-native-dotenv`
- Node.js >= 18 required
- Uses Bun for package management (bun.lock present)
