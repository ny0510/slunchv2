# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application called "슬런치v2" (slunchv2) - a Korean school meal and schedule tracking app. The app uses React Native with TypeScript and integrates with various educational APIs (NEIS, Comcigan) to provide meal information, timetables, and school schedules.

## Development Commands

### Core Development
```bash
# Start Metro bundler
bun start
# Or with cache reset
bun start:reset

# Run on iOS
bun ios
# Run on Android
bun android

# Linting
bun lint

# Testing
bun test
```

### iOS-specific
```bash
# Install/update CocoaPods dependencies
bun ios:pod
# Clean CocoaPods
bun ios:pod:clean
# Open Xcode workspace
bun ios:xcode
```

### Android-specific
```bash
# Clean Android build
bun android:clean
# Build release APK
bun android:assemble
# Build release bundle (AAB)
bun android:bundle
```

## Architecture

### Navigation Structure
The app uses React Navigation with a stack-based architecture:
- **RootStacks** (`src/navigation/RootStacks.tsx`): Main navigation container that handles onboarding flow and authenticated screens
- **BottomTabs** (`src/navigation/BottomTabs.tsx`): Tab navigation for main app screens
- Initial route determined by `isFirstOpen` state - shows onboarding for first-time users

### State Management
Context API is used for global state:
- **ThemeContext**: Manages app theme and typography
- **AuthContext**: Handles authentication state
- **UserContext**: Stores user preferences and school information

### API Layer
All API calls are centralized in `src/api/`:
- **httpClient.ts**: Axios instance with base configuration
- **index.ts**: Exports all API functions with caching support via `src/lib/cache`
- External APIs: NEIS (school meals/schedules), Comcigan (timetables)

### Key Features
1. **School Selection**: Search and select schools via NEIS/Comcigan APIs
2. **Meal Information**: Display daily school meals with allergy/nutrition info
3. **Timetables**: Show class schedules from Comcigan
4. **School Calendar**: Academic schedules and events
5. **Push Notifications**: FCM integration for meal reminders
6. **Offline Support**: AsyncStorage-based caching

### Project Structure
```
src/
├── api/          # API clients and endpoints
├── assets/       # Images, fonts, and static assets
├── components/   # Reusable UI components
├── contexts/     # React Context providers
├── hooks/        # Custom React hooks
├── lib/          # Utility functions and helpers
├── navigation/   # Navigation configuration
├── screens/      # Screen components
├── theme/        # Theme configuration and styles
└── types/        # TypeScript type definitions
```

### Environment Configuration
- Uses `react-native-dotenv` for environment variables
- Path alias `@/` maps to `./src` directory
- Babel plugins: react-native-boost, react-native-worklets

### Native Integrations
- **Firebase**: Analytics, Auth, Messaging
- **Google Sign-In**: OAuth authentication
- **Sentry**: Error tracking and monitoring
- **AdMob**: Google Mobile Ads integration
- **Share**: Native sharing functionality
- **Haptic Feedback**: Touch feedback support

## Testing Approach
- Jest with React Native preset
- Test files should be placed alongside source files
- Run specific tests with: `bun test <filename>`

## Build Requirements
- Node.js >= 18
- Bun package manager
- iOS: Xcode, CocoaPods
- Android: JDK, Android Studio/SDK
- Ruby (for iOS pod management)