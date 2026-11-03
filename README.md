# OTP Verification App (`otpverifyapp`)

A production-ready React Native mobile application implementing a **Feature-Based Architecture**, secure hardware-backed authentication storage, dynamic OTP verification, and Axios interceptors.

---

## 📱 Features

- **Feature-Based Architecture**: Modular design where each domain (`auth`, `otp`, `home`) contains its own screens, components, API services, types, and hooks.
- **Dynamic Random OTP Generation**: Random 6-digit codes generated per phone number for realistic testing.
- **Interactive On-Screen Mock Badge**: Displays the active test OTP on screen with a single tap to auto-fill.
- **6-Box OTP Input Component**: Auto-focus between inputs, backspace navigation, and multi-digit clipboard paste support.
- **Resend Countdown Timer**: Built-in 30-second reverse countdown hook (`useOtpTimer`) with automatic enable/disable states.
- **State-Driven Navigation (React Navigation v7)**: Conditional stack rendering. Automatically switches from `AuthNavigator` to `AppNavigator` when a token is present, and prevents back-button access to login screens once authenticated.
- **Hardware-Backed Secure Storage**: Uses `react-native-keychain` (Android Keystore and iOS Keychain) with in-memory caching for secure token storage.
- **Axios HTTP Client with Interceptors**:
  - **Request Interceptor**: Automatically pulls the auth token from secure storage and attaches `Authorization: Bearer <token>`.
  - **Response Interceptor**: Direct data unwrap, automatic token invalidation on `401 Unauthorized`, and user-friendly network/server error handling.
- **Centralized Logger & Method Decorators**: Logs all requests, responses, and errors cleanly in development, automatically muted in production (`__DEV__ === false`).
- **100% Strict TypeScript**: Fully typed routes, API models, navigation props, and component interfaces.

---

## 📂 Project Architecture

```text
otpverifyapp/
├── android/                         # Android native project files
├── ios/                             # iOS native project files
├── src/
│   ├── assets/                      # Static assets (images, icons, fonts)
│   │   └── .gitkeep
│   │
│   ├── components/                  # Shared global UI components
│   │   ├── Button.tsx               # Reusable primary button component
│   │   └── index.ts
│   │
│   ├── constants/                   # Global design constants and colors
│   │   ├── colors.ts                # Color palette
│   │   └── index.ts
│   │
│   ├── context/                     # Global state & React Context
│   │   ├── AuthContext.tsx          # Authentication state management (login, logout, token check)
│   │   └── index.ts
│   │
│   ├── features/                    # Feature Modules
│   │   ├── auth/                    # Authentication feature
│   │   │   ├── api/                 # Auth API endpoints (requestLoginOtp)
│   │   │   ├── screens/             # LoginScreen.tsx
│   │   │   ├── types/               # LoginRequest, LoginResponse
│   │   │   └── index.ts
│   │   │
│   │   ├── otp/                     # OTP Verification feature (Core Module)
│   │   │   ├── api/                 # verifyOtp, resendOtp, dynamic OTP generator
│   │   │   ├── components/          # OtpInput.tsx (6-box interactive input)
│   │   │   ├── hooks/               # useOtpTimer.ts (30s countdown timer)
│   │   │   ├── screens/             # OtpScreen.tsx (with on-screen test badge)
│   │   │   ├── types/               # VerifyOtpRequest, VerifyOtpResponse
│   │   │   └── index.ts
│   │   │
│   │   ├── home/                    # Post-authentication feature
│   │   │   ├── screens/             # HomeScreen.tsx (with secure logout)
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                 # Centralized features export
│   │
│   ├── navigation/                  # React Navigation setup
│   │   ├── types.ts                 # Strongly-typed route parameters
│   │   ├── AuthNavigator.tsx        # Login & OTP stack
│   │   ├── AppNavigator.tsx         # Authenticated main app stack (Home)
│   │   ├── RootNavigator.tsx        # Root container with conditional auth switching
│   │   └── index.ts
│   │
│   ├── services/                    # Networking & storage services
│   │   ├── apiClient.ts             # Axios instance with Request & Response interceptors
│   │   ├── secureStorage.ts         # Encrypted Keystore/Keychain token management
│   │   └── index.ts
│   │
│   ├── types/                       # Global shared TypeScript types
│   │   └── index.ts
│   │
│   └── utils/                       # Shared utility functions
│       ├── logger.ts                # Centralized logger, withLog, LogMethod
│       ├── validation.ts            # Phone number & OTP validators
│       └── index.ts
│
├── App.tsx                          # App entrypoint (SafeAreaProvider + AuthProvider)
├── index.js                         # React Native registry entrypoint
├── package.json
└── tsconfig.json                    # Path aliases configured (@/* -> src/*)
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: >= 22.11.0
- **JDK**: Java 17 (Microsoft OpenJDK or Eclipse Temurin)
- **Android Studio**: Android SDK (API 34/35), Android SDK Platform-Tools, Android NDK
- **Command line tools**: `npm` or `yarn`

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd otpverifyapp
   ```

2. **Install JavaScript dependencies:**
   ```bash
   npm install
   ```

---

## 🚀 Running the App

### 1. Start Metro Bundler
Start the Metro development server:
```bash
npm start
```

### 2. Run on Android
In a separate terminal window:
```bash
npm run android
```

### 3. Run on iOS (macOS only)
```bash
cd ios && pod install && cd ..
npm run ios
```

---

## 🔑 Authentication & Testing Flow

1. **Login Screen**:
   - Enter any 10-digit mobile number (e.g. `9876543210`).
   - Tap **"Send OTP"**.
   - A random 6-digit OTP will be generated, printed to your Metro terminal console, and sent to the verification screen.

2. **OTP Verification Screen**:
   - **Terminal Console Output**:
     ```text
     ====================================================
     📱 [OTP SCREEN READY] Mobile Number: +91 9876543210
     🔑 [RANDOM TEST OTP]: 482915
     ====================================================
     ```
   - **On-Screen Helper**: A dedicated badge displays the active code:
     `🎲 Random Generated OTP: 482915`
   - **Tap to Fill**: Tap the badge to automatically populate the 6 input boxes.
   - **Resend OTP**: When the 30s timer expires, tap "Resend OTP" to generate a brand new random code.
   - Tap **"Verify Code"** to complete authentication.

3. **Home Screen**:
   - The auth token is saved to Android Keystore / iOS Keychain.
   - `RootNavigator` automatically unmounts the Auth stack and mounts `AppNavigator`.
   - Tap **"Logout"** to clear the secure token and return to the Login screen.

---

## 🌐 API Client & Interceptors Guide

The `apiClient` service wraps Axios and manages authentication headers automatically.

### Making API Requests

```typescript
import { apiClient } from '@/services/apiClient';

// 1. GET Request (with query params)
const users = await apiClient.get<UserResponse>('/users', { page: 1, limit: 10 });

// 2. POST Request (with body)
const result = await apiClient.post<LoginResponse>('/auth/login', { phoneNumber: '9876543210' });

// 3. PUT Request (with ID + body)
const updated = await apiClient.put<UserResponse>('/users/123', { name: 'John Doe' });

// 4. DELETE Request
await apiClient.delete('/users/123');
```

---

## 🧪 Verification & Type Checking

To verify that all TypeScript code passes without errors:
```bash
npx tsc --noEmit
```

---

## 📄 License
This project is private and intended for internal development.
