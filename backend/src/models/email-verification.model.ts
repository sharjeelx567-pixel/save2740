import mongoose, { Schema, Document } from "mongoose"

export interface IEmailVerification extends Document {
  email: string
  code: string
  expiresAt: Date
  attempts: number
  verified: boolean
  createdAt: Date
}

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
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

export const EmailVerification =
  mongoose.models.EmailVerification ||
  mongoose.model<IEmailVerification>("EmailVerification", emailVerificationSchema)
