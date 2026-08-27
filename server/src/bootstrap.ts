import { prisma } from './utils/db.js'
import { hashPassword } from './utils/password.js'

const ROOT_ADMIN = {
  email: 'falmitesfaye@gmail.com',
  username: 'Falmite Sefaye',
  phone: '+251911000001',
  role: 'admin' as const,
  roles: ['admin'],
  isRootAdmin: true,
}

const ROOT_ADMIN_PASSWORD = 'SecurePass@123'

/**
 * Ensures the hardcoded root admin account exists. Runs on server startup —
 * idempotent (upserts by email) so it is safe to call on every boot.
 */
export async function ensureRootAdmin(): Promise<void> {
  const password = await hashPassword(ROOT_ADMIN_PASSWORD)
  const existing = await prisma.user.findFirst({ where: { email: ROOT_ADMIN.email } })

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        username: ROOT_ADMIN.username,
        phone: ROOT_ADMIN.phone,
        password,
        role: ROOT_ADMIN.role,
        roles: ROOT_ADMIN.roles,
        status: 'Approved',
        isRootAdmin: true,
        emailVerified: true,
        onboardingComplete: true,
      },
    })
  } else {
    await prisma.user.create({
      data: {
        username: ROOT_ADMIN.username,
        email: ROOT_ADMIN.email,
        phone: ROOT_ADMIN.phone,
        password,
        role: ROOT_ADMIN.role,
        roles: ROOT_ADMIN.roles,
        status: 'Approved',
        isRootAdmin: true,
        emailVerified: true,
        onboardingComplete: true,
      },
    })
  }
}
