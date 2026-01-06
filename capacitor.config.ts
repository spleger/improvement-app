import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transform.app',
  appName: 'Transform',
  webDir: 'public',
  server: {
    url: 'https://improvement-app.vercel.app',
    cleartext: true
  }
};

export default config;
