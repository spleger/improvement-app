import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transform.app',
  appName: 'Transform',
  webDir: 'public',
  server: {
    url: 'https://YOUR_APP_URL.vercel.app', // Update this with your actual Vercel URL
    cleartext: true
  }
};

export default config;
