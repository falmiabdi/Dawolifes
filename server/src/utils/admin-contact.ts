import { prisma } from '../lib/prisma.js'

const FALLBACK_PHONE = '+251947896869'

/**
 * Resolve the platform's "System Admin" identity used as the default contact
 * on listings. The phone comes from the site settings (contactPhone1); the
 * message recipient is the admin account whose phone matches it, falling back
 * to the single (or earliest-created) admin account when no match exists.
 */
export async function resolveSystemAdmin() {
  const setting = await prisma.setting.findUnique({ where: { id: 'default' } })
  const phone = setting?.contactPhone1?.trim() || FALLBACK_PHONE
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, phone: true },
    orderBy: { createdAt: 'asc' },
  })
  const matched =
    admins.find((a) => a.phone && a.phone.trim() === phone) || admins[0] || null

  return {
    id: matched ? matched.id : null,
    name: 'System Admin',
    phone,
    photo: '',
  }
}