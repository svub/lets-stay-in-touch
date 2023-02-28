import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'stay.in.touch',
  appName: 'stay-in-touch',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: { cleartext: true }
};

export default config;
