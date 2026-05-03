# GPS Attendance System - JKUAT

[![Expo](https://img.shields.io/badge/Expo-46BC2C?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

## 📱 Overview

**GPS Attendance** is a secure, location-based mobile attendance management system designed for Jomo Kenyatta University of Agriculture and Technology (JKUAT).

**Key Features:**

- ✅ **Geofencing**: Students must be within 150m of campus coordinates (-1.099966, 37.007234)
- 🔐 **Biometric Authentication**: Face ID / Fingerprint verification
- 👥 **Role-Based Access**: Separate portals for Students & Lecturers
- ☁️ **Supabase Backend**: Real-time auth, database, & session management
- 📊 **Live Sessions**: Lecturers control active attendance periods
- 📈 **Attendance History & Reports**
- 🎓 **University-Specific**: Tailored for JKUAT (currently hardcoded for SCT211)

## 🎨 Screenshots

| Login Screen                                                           | Student Attendance                                                                | Lecturer Dashboard                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ![Login](https://via.placeholder.com/400x800/185FA5/FFFFFF?text=Login) | ![Student](https://via.placeholder.com/400x800/E8F5E9/2E7D32?text=Student+Portal) | ![Lecturer](https://via.placeholder.com/400x800/E3F2FD/1565C0?text=Lecturer) |

_(Add actual screenshots to `docs/screenshots/` folder)_

## 🛠 Tech Stack

```
Frontend: Expo SDK 54 • React Native • Expo Router • TypeScript
Auth: Supabase Auth (Email/Password)
Database: Supabase Postgres
Location: expo-location (High Accuracy GPS)
Security: expo-local-authentication (Biometrics)
UI: NativeWind/Tailwind • Ionicons • Reanimated
Navigation: Stack + Tab Router
Storage: expo-secure-store
```

## 📋 Prerequisites

1. **Node.js** 18+
2. **Expo CLI**: `npm install -g @expo/cli`
3. **Supabase Account** (Free tier sufficient)
4. **Android Studio** or **XCode** (for emulators)
5. **Location Permissions** on test devices

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd AttendanceApp
npm install
```

### 2. Start Development Server

```bash
npx expo start
```

- **iOS**: `i` (XCode Simulator)
- **Android**: `a` (Android Studio Emulator)
- **Web**: `w`
- **Device**: Scan QR with Expo Go

### 3. Configure Supabase

The app uses a **public Supabase project**. Update `supabase.js` or create matching tables:

```bash
# Supabase Project URL: https://wnqjhmkuwjmaumbukpxg.supabase.co
# Anon Key: sb_publishable_dD60jnGCmn1ez_2D8z_7Cw_3Xi2cY53 (Development only!)
```

**Required Tables (SQL):**

```sql
-- Profiles (User metadata)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users DEFAULT uuid_generate_v4() PRIMARY KEY,
  role TEXT CHECK (role IN ('student', 'lecturer')) DEFAULT 'student',
  reg_number TEXT,
  full_name TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (Live attendance control)
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  course_code TEXT NOT NULL DEFAULT 'SCT211',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Logs
CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'Present',
  marked_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Add policies for authenticated users...
```

**Auth Settings**: Enable Email auth in Supabase dashboard.

## 👨‍🎓 Usage

### Student Flow

1. **Login** with university email (`name@jkuat.ac.ke`)
2. **Check Status**: Session live? Within geofence (150m)?
3. **Enter Reg Number** & **Biometric Scan**
4. **Attendance Marked** → View history

### Lecturer Flow

1. **Lecturer Login** → Dashboard
2. **Start Session** (sets `sessions.is_active = true`)
3. **Monitor** real-time attendance
4. **View Reports** → Export data
5. **End Session**

## 🧪 Testing

### Emulator Location Testing

```
Android Emulator: Extended Controls → Location → Set: -1.099966, 37.007234
iOS Simulator: Features → Location → Custom Location
```

### Permissions

App requests: **Location (Foreground)**, **Biometrics**

## 🔧 Troubleshooting

| Issue            | Solution                                                                        |
| ---------------- | ------------------------------------------------------------------------------- |
| "Out of Range"   | Verify GPS coords, test permissions                                             |
| Login fails      | Check Supabase email auth, verify profiles table                                |
| Biometrics fail  | Test on physical device                                                         |
| Session not live | Insert `INSERT INTO sessions (course_code, is_active) VALUES ('SCT211', true);` |
| Table errors     | Run schema SQL exactly                                                          |

## 🚀 Deployment

```bash
npm install -g @expo/cli eas-cli
eas login
eas build --platform all
```

## 📁 Project Structure

```
AttendanceApp/
├── app/                 # Expo Router screens
│   ├── login.tsx        # Auth screens
│   ├── attendance.tsx   # Student portal
│   └── lecturer/        # Lecturer dashboard
├── components/          # Reusable UI
├── hooks/              # Custom hooks (geofence)
├── supabase.js         # Supabase client
└── assets/images/      # App icons/splash
```

## 🤝 Contributing

1. Fork & create PR
2. Add your feature/tests
3. Update README if needed
4. Follow TypeScript/Prettier standards

## ⚠️ Security Notes

- **Production**: Use service_role keys securely, never expose anon keys
- **RLS**: Implement proper row-level policies
- **Coords**: Make configurable (env vars)
- **Course**: Currently hardcoded `SCT211`

## 📄 License

MIT - Built with ❤️ for JKUAT educational excellence!

---

**⭐ Star the repo if this helps your attendance system!** 👨‍🎓✨
