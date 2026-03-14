const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const SHG = require('./models/SHG');
const connectDB = require('./config/db');

dotenv.config({ path: './.env' });

const runTest = async () => {
    try {
        await connectDB();
        console.log('--- STARTING E2E DB CONSISTENCY TEST ---');

        // 1. Create dummy admin
        const adminEmail = `admin_${Date.now()}@test.com`;
        const memberEmail = `member_${Date.now()}@test.com`;

        const admin = await User.create({
            name: 'Test Admin',
            email: adminEmail,
            password: 'password123',
            role: 'admin'
        });

        // 2. Create dummy member
        const member = await User.create({
            name: 'Test Member',
            email: memberEmail,
            password: 'password123',
            role: 'member'
        });

        // 3. Admin creates SHG
        const shg = await SHG.create({
            name: `Test SHG ${Date.now()}`,
            admin: admin._id,
        });

        // 4. Simulate addMember logic
        console.log(`[TEST] Assigning ${memberEmail} to SHG ${shg.name}`);
        shg.members.push(member._id);
        member.shg = shg._id;

        await shg.save();
        await member.save();

        // 5. Verify DB Consistency
        const verifyMember = await User.findById(member._id);
        const verifySHG = await SHG.findById(shg._id);

        console.log(`[TEST] Member.shg: ${verifyMember.shg}`);
        console.log(`[TEST] SHG.members includes member? ${verifySHG.members.includes(verifyMember._id)}`);

        if (verifyMember.shg.toString() === verifySHG._id.toString() && verifySHG.members.includes(verifyMember._id)) {
            console.log('✅ SUCCESS: DB Consistency Confirmed. User-SHG relationship is bidirectional and accurate.');
        } else {
            console.log('❌ FAILURE: DB Consistency Failed.');
        }

        console.log('--- CLEANING UP ---');
        await User.findByIdAndDelete(admin._id);
        await User.findByIdAndDelete(member._id);
        await SHG.findByIdAndDelete(shg._id);

        console.log('Cleanup complete. Exiting.');
        process.exit(0);
    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    }
};

runTest();
