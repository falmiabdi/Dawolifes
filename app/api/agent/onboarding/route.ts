import { NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { UserModel } from '@/lib/models/user'

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session?.userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  await connectToDatabase()

  const updateData: Record<string, unknown> = {}

  // Step 1 - Personal
  if (body.fullName !== undefined) updateData.fullName = body.fullName
  if (body.gender !== undefined) updateData.gender = body.gender
  if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth
  if (body.nationality !== undefined) updateData.nationality = body.nationality
  if (body.preferredLanguage !== undefined) updateData.preferredLanguage = body.preferredLanguage

  // Step 2 - Contact
  if (body.ethPhone !== undefined) updateData.ethPhone = body.ethPhone
  if (body.safaricomPhone !== undefined) updateData.safaricomPhone = body.safaricomPhone
  if (body.region !== undefined) updateData.region = body.region
  if (body.city !== undefined) updateData.city = body.city
  if (body.woreda !== undefined) updateData.woreda = body.woreda
  if (body.kebele !== undefined) updateData.kebele = body.kebele
  if (body.fullAddress !== undefined) updateData.fullAddress = body.fullAddress

  // Step 3 - Documents
  if (body.faydaFront !== undefined) updateData.faydaFront = body.faydaFront
  if (body.faydaBack !== undefined) updateData.faydaBack = body.faydaBack
  if (body.selfieFayda !== undefined) updateData.selfieFayda = body.selfieFayda
  if (body.passportPhoto !== undefined) updateData.passportPhoto = body.passportPhoto

  // Step 4 - Education
  if (body.highestEducation !== undefined) updateData.highestEducation = body.highestEducation
  if (body.educationCertificate !== undefined) updateData.educationCertificate = body.educationCertificate

  // Step 5 - Professional
  if (body.agentExperience !== undefined) updateData.agentExperience = body.agentExperience
  if (body.companyName !== undefined) updateData.companyName = body.companyName
  if (body.officeAddress !== undefined) updateData.officeAddress = body.officeAddress
  if (body.businessLicenseNumber !== undefined) updateData.businessLicenseNumber = body.businessLicenseNumber
  if (body.businessLicenseFile !== undefined) updateData.businessLicenseFile = body.businessLicenseFile
  if (body.tinNumber !== undefined) updateData.tinNumber = body.tinNumber

  // Step 6 - Final submit
  if (body.onboardingComplete) {
    updateData.onboardingComplete = true
    updateData.status = 'Pending'
  }

  await UserModel.findByIdAndUpdate(session.userId, updateData)

  return NextResponse.json({ ok: true })
}
