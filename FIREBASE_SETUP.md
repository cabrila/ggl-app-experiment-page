# Firebase Magic Link Authentication Setup

## Environment Variables Required

Add the following environment variables to your Vercel project settings (Settings → Vars):

### Firebase Configuration (Public Variables - safe to expose in browser)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain (e.g., your-project.firebaseapp.com)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID

## Where to Find These Values

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the settings icon (⚙️) in the top left
4. Go to "Project Settings"
5. Under the "Your apps" section, find your web app configuration
6. Copy all the values from the `firebaseConfig` object

## Magic Link Configuration

The magic link authentication is configured to:
- Send emails with a link back to `/auth/callback`
- Automatically complete sign-in when users click the email link
- Store user session via Firebase Authentication
- Redirect authenticated users to the splash screen

## Testing the Flow

1. Enter an email on the login screen
2. Click "Send magic link"
3. Check your email for the authentication link
4. Click the link to automatically log in
5. You'll be redirected to the splash screen

## Notes

- The `sendSignInLinkToEmail` function requires email enumeration protection to be disabled or the sender domain to be whitelisted in Firebase
- Magic links expire after 24 hours by default in Firebase
- Users are automatically logged out by clicking "Sign Out" in the splash screen user menu
