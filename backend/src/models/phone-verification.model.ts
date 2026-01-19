import mongoose, { Schema, Document } from "mongoose"

export interface IPhoneVerification extends Document {
  phoneNumber: string
  otp: string
  expiresAt: Date
  attempts: number
  verified: boolean
  createdAt: Date
}

const phoneVerificationSchema = new Schema<IPhoneVerification>(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete after expiry
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

export const PhoneVerification =
  mongoose.models.PhoneVerification ||
  mongoose.model<IPhoneVerification>("PhoneVerification", phoneVerificationSchema)
