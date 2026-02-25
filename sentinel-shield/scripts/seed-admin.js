// Script to delete all existing admins and create one single admin account
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

const UserSchema = new mongoose.Schema({
    email: String,
    passwordHash: String,
    name: String,
    role: String,
    orgId: String,
    orgName: String,
    isVerified: Boolean,
    isApproved: Boolean,
    mfaEnabled: Boolean,
    trustedDevices: [String],
    totalLogins: Number,
    qrScansCount: Number,
    reportsFiled: Number,
    safeModeUsage: Number,
    reportsDownloaded: Number,
    safetyScore: Number,
    isSuspended: Boolean,
    isOnline: Boolean,
}, { timestamps: true });

async function main() {
    await mongoose.connect(MONGODB_URI);
    const User = mongoose.model('User', UserSchema);

    // Step 1: Delete ALL existing admins
    const deleted = await User.deleteMany({ role: 'admin' });
    console.log(`Deleted ${deleted.deletedCount} existing admin(s).`);

    // Step 2: Create single admin
    const passwordHash = await bcrypt.hash('satya1234', 12);
    const admin = await User.create({
        name: 'Satya Admin',
        email: 'satya1234@ai.com',
        passwordHash,
        role: 'admin',
        orgId: 'org-sentinel-001',
        orgName: 'Sentinel Shield HQ',
        isVerified: true,
        isApproved: true,
        mfaEnabled: false,
        trustedDevices: [],
        totalLogins: 0,
        qrScansCount: 0,
        reportsFiled: 0,
        safeModeUsage: 0,
        reportsDownloaded: 0,
        safetyScore: 100,
        isSuspended: false,
        isOnline: false,
    });

    console.log('Admin created successfully!');
    console.log('  Email:    satya1234@ai.com');
    console.log('  Password: satya1234');
    console.log('  ID:       ' + admin._id);

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
