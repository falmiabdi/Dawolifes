import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import fs from 'fs'

let app: App | null = null

export function initializeFirebaseAdmin(): App {
  const existingApps = getApps()
  if (existingApps.length > 0) {
    return existingApps[0]
  }

  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT
    const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const projectId = process.env.FIREBASE_PROJECT_ID || 'dawolife-797b5'

    if (serviceAccountEnv) {
      let credObject: any
      if (serviceAccountEnv.trim().startsWith('{')) {
        credObject = JSON.parse(serviceAccountEnv)
      } else if (fs.existsSync(serviceAccountEnv)) {
        credObject = JSON.parse(fs.readFileSync(serviceAccountEnv, 'utf8'))
      }

      if (credObject) {
        app = initializeApp({
          credential: cert(credObject),
          projectId: credObject.project_id || projectId,
        })
        console.log(`[Firebase Admin] Initialized with service account for project: ${app.options.projectId}`)
        return app
      }
    }

    if (googleAppCreds && fs.existsSync(googleAppCreds)) {
      app = initializeApp({
        credential: applicationDefault(),
        projectId,
      })
      console.log(`[Firebase Admin] Initialized with application default credentials`)
      return app
    }

    // Default initialization (projectId)
    app = initializeApp({
      projectId,
    })
    console.log(`[Firebase Admin] Initialized with project ID: ${projectId}`)
    return app
  } catch (err: any) {
    console.warn(`[Firebase Admin] Warning during initialization: ${err.message}`)
    // Return existing if created in another tick or re-throw if needed
    const apps = getApps()
    if (apps.length > 0) return apps[0]
    app = initializeApp({ projectId: 'dawolife-797b5' })
    return app
  }
}

export interface VerifiedFirebaseUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  picture?: string
  phoneNumber?: string
}

/**
 * Verifies a Firebase ID token.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  const adminApp = initializeFirebaseAdmin()
  const auth = getAuth(adminApp)
  
  const decoded = await auth.verifyIdToken(idToken)
  
  if (!decoded.email) {
    throw new Error('Firebase token does not contain an email address.')
  }

  return {
    uid: decoded.uid,
    email: decoded.email.trim().toLowerCase(),
    emailVerified: Boolean(decoded.email_verified),
    name: (decoded.name || decoded.displayName) as string | undefined,
    picture: (decoded.picture || decoded.photoURL) as string | undefined,
    phoneNumber: decoded.phone_number as string | undefined,
  }
}
