import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  type Auth,
  type User,
} from 'firebase/auth'

import { getFirebaseApp } from '@/lib/firebase'

let auth: Auth | null = null

function getAuthInstance(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp())
  return auth
}

/**
 * Opens the Google sign-in sheet and returns the Firebase ID token (plus
 * email) for exchanging against the DawoLife backend. Returns `null` when the
 * user closes the sheet without choosing an account.
 */
export async function signInWithGoogle(): Promise<{ idToken: string; email: string | null } | null> {
  const provider = new GoogleAuthProvider()
  const credential = await signInWithPopup(getAuthInstance(), provider)
  const idToken = await credential.user.getIdToken()
  return { idToken, email: credential.user.email }
}

/**
 * Creates a Firebase account (if it does not exist) and sends a verification
 * email. Non-fatal failures (e.g. account already exists) are swallowed by the
 * caller; the backend OTP flow remains the fallback.
 */
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

/** Resends the verification email to the currently signed-in user. */
export async function resendFirebaseVerification(): Promise<void> {
  const current = getAuthInstance().currentUser
  if (!current) return
  await sendEmailVerification(current)
}

/** Reloads the current user and reports whether the email is verified. */
export async function isFirebaseEmailVerified(): Promise<boolean> {
  const current = getAuthInstance().currentUser
  if (!current) return false
  await current.reload()
  return current.emailVerified
}

/**
 * Signs into Firebase so a later verification check works even after a page
 * reload (the firebase user session persists in localStorage/IndexedDB).
 */
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

/** Signs out of Firebase only (does not clear the backend session). */
export async function signOutFirebase(): Promise<void> {
  await getAuthInstance().signOut()
}