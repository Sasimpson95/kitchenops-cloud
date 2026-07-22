import type { CapacitorConfig } from '@capacitor/cli';

/**
 * KitchenOps Android shell
 *
 * Replace the URL below with the LIVE HTTPS KitchenOps URL before running:
 *   npm run android:sync
 *
 * Example:
 *   https://your-kitchenops-domain.co.uk
 *   https://your-project.vercel.app
 */
const KITCHENOPS_LIVE_URL = 'https://kitchenops-cloud.vercel.app/login';

const config: CapacitorConfig = {
  appId: 'com.kitchenops.app',
  appName: 'KitchenOps',
  webDir: 'public',
  server: {
    url: KITCHENOPS_LIVE_URL,
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1600,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
