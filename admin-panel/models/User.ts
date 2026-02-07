import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: 'user' | 'admin' | 'super_admin';
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// Check if model already exists to avoid recompilation error in dev
const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
    },
    { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
