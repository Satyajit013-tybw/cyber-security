const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const col = mongoose.connection.collection('users');

    // Fix users missing safetyScore or other tracking fields
    const result = await col.updateMany(
        { safetyScore: { $in: [null, 0] } },
        { $set: { safetyScore: 100, qrScansCount: 0, reportsFiled: 0, safeModeUsage: 0, reportsDownloaded: 0, isSuspended: false } }
    );
    console.log('Fixed ' + result.modifiedCount + ' users with missing tracking fields');

    // Show all users current status
    const users = await col.find({}, { projection: { name: 1, email: 1, isOnline: 1, lastLogin: 1, safetyScore: 1, role: 1 } }).toArray();
    users.forEach(u => {
        console.log(`  ${u.name} | ${u.email} | online: ${u.isOnline} | score: ${u.safetyScore} | role: ${u.role}`);
    });

    await mongoose.disconnect();
}

fix().catch(e => { console.error(e); process.exit(1); });
