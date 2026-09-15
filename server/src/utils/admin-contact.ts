import { prisma } from '../lib/prisma.js'

const FALLBACK_PHONE = '+251947896869'
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