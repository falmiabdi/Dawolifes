import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { Camera } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { Network } from '@capacitor/network'
import { Share } from '@capacitor/share'
import { LocalNotifications } from '@capacitor/local-notifications'
import { PushNotifications } from '@capacitor/push-notifications'

export function initializeCapacitorPlugins() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  // Hide splash screen after app is fully ready
  setTimeout(() => {
    SplashScreen.hide().catch((error) => {
      console.warn('[Capacitor] SplashScreen.hide failed:', error)
    })
  }, 800)

  // Set status bar style
  StatusBar.setStyle({ style: 'LIGHT' })
  StatusBar.setBackgroundColor({ color: '#F97316' })

  // Configure keyboard resize (iOS-only runtime API; on Android it is
  // configured statically via the "Keyboard" entry in capacitor.config.ts)
  if (Capacitor.getPlatform() === 'ios') {
    Keyboard.setResizeMode({ resize: 'body' }).catch((error) => {
      console.warn('[Capacitor] Keyboard.setResizeMode unavailable:', error)
    })
  }
}

export async function takePhoto(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: 'uri',
  })

  return image.webPath || null
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
  })

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  }
}

export async function getNetworkStatus() {
  if (!Capacitor.isNativePlatform()) {
    return { connected: true }
  }

  const status = await Network.getStatus()
  return {
    connected: status.connected,
    connectionType: status.connectionType,
  }
}

export async function shareContent(url: string, title: string, text: string) {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  await Share.share({ url, title, text })
}

export async function scheduleLocalNotification(title: string, body: string) {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        title,
        body,
        id: Date.now(),
        schedule: { at: new Date(Date.now() + 1000) },
      },
    ],
  })
}

export function setupPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  PushNotifications.registerPermissions()

  PushNotifications.addListener('registration', (token) => {
    console.log('Push notification token:', token.value)
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed:', notification)
  })
}
