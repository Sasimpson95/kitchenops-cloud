import type { CapacitorConfig } from '@capacitor/cli';

/**
 * KitchenOps native shell
 *
 * Production app:
 * https://app.kitchenops.co.uk
 */
const KITCHENOPS_LIVE_URL = 'https://app.kitchenops.co.uk/login';

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