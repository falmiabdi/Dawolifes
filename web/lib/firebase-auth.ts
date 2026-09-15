import {
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type User,
} from 'firebase/auth'

import { getFirebaseApp } from '@/lib/firebase'

let auth: Auth | null = null

function getAuthInstance(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp())
  return auth
}











export async function signInWithGoogle(): Promise<{ idToken: string; email: string | null } | null> {
  const provider = new GoogleAuthProvider()

  try {
    const credential = await signInWithPopup(getAuthInstance(), provider)
    const idToken = await credential.user.getIdToken()
    return { idToken, email: credential.user.email }
  } catch (err: any) {
    
    
    
    const popupBlockedCodes = [
      'auth/operation-not-supported-in-this-environment',
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
    ]
    if (popupBlockedCodes.includes(err?.code)) {
      console.warn('[Google Auth] Popup blocked, falling back to redirect:', err?.code)
      await signInWithRedirect(getAuthInstance(), provider)
      return null
    }
    throw err
  }
}





export async function getGoogleRedirectResult(): Promise<{ idToken: string; email: string | null } | null> {
  const result = await getRedirectResult(getAuthInstance())
  if (!result) return null
  const idToken = await result.user.getIdToken()
  return { idToken, email: result.user.email }
}






export async function createFirebaseUser(
  email: string,
  password: string
): Promise<User | null> {
  const credential = await createUserWithEmailAndPassword(
    getAuthInstance(),
    email,
    password
  )
  await sendEmailVerification(credential.user)
  return credential.user
}


export async function resendFirebaseVerification(): Promise<void> {
  const current = getAuthInstance().currentUser
  if (!current) return
  await sendEmailVerification(current)
}


export async function isFirebaseEmailVerified(): Promise<boolean> {
  const current = getAuthInstance().currentUser
  if (!current) return false
  await current.reload()
  return current.emailVerified
}





export async function signInFirebaseUser(
  email: string,
  password: string
): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(getAuthInstance(), email, password)
    return true
  } catch {
    return false
  }
}


export async function signOutFirebase(): Promise<void> {
  await getAuthInstance().signOut()
}