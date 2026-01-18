/**
 * Profile API Route - GET/PUT user profile
 * /api/profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/auth.model'
import jwt from 'jsonwebtoken'

// GET /api/profile - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('authToken')?.value

    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let userId
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user profile from database
    const profile = {
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      dateOfBirth: user.dateOfBirth || null,
      gender: user.gender || null,
      address: user.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      profilePicture: user.profilePicture || {
        url: '/images/profile-default.jpg',
        uploadedAt: null,
      },
      bio: user.bio || '',
      accountTier: user.accountTier || 'basic',
      emergencyContact: user.emergencyContact || {
        name: '',
        phone: '',
        relationship: '',
      },
      updatedAt: user.updatedAt?.toISOString(),
    }

    return NextResponse.json(
      { success: true, data: profile },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}


// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    let token = request.cookies.get('authToken')?.value

    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let userId
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, phone, dateOfBirth, gender, address, bio, emergencyContact } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First and last name are required' },
        { status: 400 }
      )
    }

    await connectDB()
    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phoneNumber: phone,
        dateOfBirth,
        gender,
        address,
        bio,
        emergencyContact,
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedProfile = {
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      dateOfBirth: user.dateOfBirth || null,
      gender: user.gender || null,
      address: user.address || {},
      bio: user.bio || '',
      emergencyContact: user.emergencyContact || {},
      updatedAt: user.updatedAt?.toISOString(),
    }

    return NextResponse.json(
      { success: true, data: updatedProfile },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
