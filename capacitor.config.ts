import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brackora.app',
  appName: 'BRACKORA',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.12:5173',
    cleartext: true
  },
};

export default config;
