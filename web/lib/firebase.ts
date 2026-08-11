import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'

// Values mirror android/app/google-services.json (project: dawolife-797b5).
const firebaseConfig = {
  apiKey: 'AIzaSyBk10Jj3G7sycgt7JrCsS1OZ-plMC53068',
  projectId: 'dawolife-797b5',
  storageBucket: 'dawolife-797b5.firebasestorage.app',
  messagingSenderId: '937308603015',
  authDomain: 'dawolife-797b5.firebaseapp.com',
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig)
  }
  return getApp()
}