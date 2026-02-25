import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    name: string;
    role: 'admin' | 'moderator' | 'viewer';
    orgId: string;
    orgName: string;
    avatar?: string;
    isVerified: boolean;
    isApproved: boolean;
    mfaSecret?: string;
    mfaEnabled: boolean;
    emailNotifications: boolean;
    trustedDevices: string[];
    // Activity tracking
    lastLogin?: Date;
    lastLogout?: Date;
    lastSessionDuration?: number;
    totalLogins: number;
    qrScansCount: number;
    reportsFiled: number;
    safeModeUsage: number;
    reportsDownloaded: number;
    safetyScore: number;
    isSuspended: boolean;
    isOnline: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true },
        passwordHash: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, enum: ['admin', 'moderator', 'viewer'], default: 'viewer' },
        orgName: { type: String, required: true },
        orgId: { type: String, required: true },
        avatar: { type: String },
        isVerified: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false },
        mfaSecret: { type: String },
        mfaEnabled: { type: Boolean, default: false },
        emailNotifications: { type: Boolean, default: true },
        trustedDevices: [{ type: String }],
        // Activity tracking
        lastLogin: { type: Date },
        lastLogout: { type: Date },
        lastSessionDuration: { type: Number, default: 0 },
        totalLogins: { type: Number, default: 0 },
        qrScansCount: { type: Number, default: 0 },
        reportsFiled: { type: Number, default: 0 },
        safeModeUsage: { type: Number, default: 0 },
        reportsDownloaded: { type: Number, default: 0 },
        safetyScore: { type: Number, default: 0 },
        isSuspended: { type: Boolean, default: false },
        isOnline: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const User = models.User || model<IUser>('User', UserSchema);
