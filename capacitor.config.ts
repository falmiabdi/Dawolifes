import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.delaharme.app',
  appName: 'DawoLife',
  webDir: 'client/out',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#F97316',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F97316',
    },
    Keyboard: {
      resize: 'body',
    },
    // CapacitorHttp disabled — rely on window.fetch patch for URL rewriting
    CapacitorHttp: {
      enabled: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scheme: 'dawolife',
    hostname: 'dawolife.app',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
}

export default config
