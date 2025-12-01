# Google Login Setup Guide

## Current Status
✅ Desktop (Next.js): Google credentials configured
✅ Mobile (React Native): Google Sign-In package installed
⚠️ Backend integration needed for both platforms

## Steps to Complete Google Login

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your existing OAuth 2.0 Client ID: `780374160784-837vjccdidfq7paqce9ee68kgtllrg4e`

3. **Add Authorized JavaScript origins:**
   - `http://localhost:3000`
   - Add your production domain when ready (e.g., `https://yourdomain.com`)

4. **Add Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - Add production callback when ready (e.g., `https://yourdomain.com/api/auth/callback/google`)

5. **For Mobile - Create Android OAuth Client:**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Android**
   - Package name: Check your `app.json` → `expo.android.package` (or use default: `host.exp.exponent`)
   - SHA-1 certificate fingerprint: 
     
     **For Expo Go (development):**
     Use Expo's debug keystore SHA-1: `A5:88:41:04:8D:06:71:6D:FE:33:76:87:AC:AC:B5:BE:BD:B2:5B:F9`
     
     **For production build:**
     ```bash
     cd app/mobile-fe
     eas credentials
     ```
     Then follow prompts to get your production SHA-1
     
     **OR generate local keystore:**
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```

6. **For Mobile - Create iOS OAuth Client:**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **iOS**
   - Bundle ID: Get from `app.json` → `expo.ios.bundleIdentifier` (or `com.yourcompany.inventokrupaul`)

### 2. Update Environment Variables

**Desktop (.env.local):**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

**Mobile (.env):**
Create this file in `app/mobile-fe/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id-here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id-here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id-here
```

### 3. Backend Integration (Required for Both Platforms)

You need to create backend endpoints to handle Google OAuth tokens:

**Create: `backend/functions/auth/google-login.ts`** (or similar):
```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export async function verifyGoogleToken(idToken: string) {
  // Verify the Google ID token with Google's servers
  // Then create/update user in your database
  // Return JWT token for your app
}
```

### 4. Desktop Testing

1. Start the desktop app:
   ```bash
   cd app/desktop-fe
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`
3. Click "Continue with Google"
4. You should see the Google OAuth consent screen
5. After authorization, you'll be redirected back and logged in

### 5. Mobile Testing

1. Update the Google Sign-In configuration in `hooks/use-google-auth.ts`:
   ```typescript
   GoogleSignin.configure({
     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // Only if different from webClientId
     offlineAccess: true,
   });
   ```

2. Start the mobile app:
   ```bash
   cd app/mobile-fe
   npx expo start
   ```

3. On the login screen, tap "Continue with Google"
4. Complete the Google sign-in flow
5. Currently shows success message - needs backend integration

## What's Working Now

### Desktop:
- ✅ NextAuth.js configured with Google Provider
- ✅ Google credentials loaded from .env.local
- ⚠️ Needs authorized redirect URIs in Google Console
- ⚠️ Needs backend session management

### Mobile:
- ✅ Google Sign-In package installed
- ✅ Hook created for Google authentication
- ✅ Login screen updated with Google button
- ⚠️ Needs iOS/Android client IDs from Google Console
- ⚠️ Needs backend endpoint to exchange Google token for app token

## Next Steps (Priority Order)

1. **Add redirect URIs in Google Console** (5 minutes)
   - This will make desktop Google login work immediately

2. **Test desktop Google login** (2 minutes)
   - Just click the button and verify it works

3. **Create Android & iOS OAuth clients** (10 minutes)
   - Needed for mobile Google Sign-In

4. **Add mobile client IDs to .env** (2 minutes)
   - Update the mobile app configuration

5. **Create backend Google auth endpoint** (30 minutes)
   - Verify Google ID token
   - Create/find user in database
   - Return JWT for your app

6. **Update mobile auth to use backend** (15 minutes)
   - Send Google ID token to backend
   - Store JWT from backend response
   - Navigate to home screen

## Common Issues

### "redirect_uri_mismatch" error
- Go to Google Console and add the exact redirect URI shown in the error

### Mobile: "Developer Error"
- **For Expo Go development:** Use SHA-1: `A5:88:41:04:8D:06:71:6D:FE:33:76:87:AC:AC:B5:BE:BD:B2:5B:F9` and package: `host.exp.exponent`
- **For standalone builds:** Use your own SHA-1 from `eas credentials` and your app's package name
- Verify package name matches exactly what's in Google Console

### Mobile: "Sign in cancelled"
- User cancelled - this is normal

### Backend: "Invalid token"
- Google ID token expired (valid for 1 hour)
- Need to refresh token or re-authenticate

## Resources

- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Expo Google Authentication](https://docs.expo.dev/guides/google-authentication/)
