# PAB App

Expo React Native app for Pregnant and Black.

## Local setup

1. Install dependencies

   ```bash
   npm install
   ```

3. Fill in these required values in `.env`

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the app

   ```bash
   npx expo start
   ```

## Required environment variables

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

These values are required at startup. If either one is missing or invalid, the app will stop with a descriptive configuration error instead of crashing later during initialization.

## Notes

- `.env` is for local development and is gitignored.
