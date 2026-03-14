const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const SHG = require('./models/SHG');
const connectDB = require('./config/db');

dotenv.config({ path: './.env' });

const debugFlow = async () => {
    try {
        await connectDB();
        console.log('--- STARTING DEBUG FULL FLOW PORT 5000 ---');

        const adminEmail = `adminflow_${Date.now()}@test.com`;
        const memberEmail = `memberflow_${Date.now()}@test.com`;

        // 1. Create Admin
        const adminRes = await axios.post('http://localhost:5000/api/users', {
            name: 'Debug Admin',
            email: adminEmail,
            password: 'password123',
            role: 'admin'
        });
        const adminToken = adminRes.data.token;

        // 2. Create Member
        const memberRes = await axios.post('http://localhost:5000/api/users', {
            name: 'Debug Member',
            email: memberEmail,
            password: 'password123',
            role: 'member'
        });
        const memberToken = memberRes.data.token;

        // 3. Admin creates SHG
        const shgRes = await axios.post('http://localhost:5000/api/shg', {
            name: `Debug SHG ${Date.now()}`
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        console.log(`[DEBUG] SHG created: ${shgRes.data._id}`);

        // 4. Admin adds member
        try {
            await axios.put('http://localhost:5000/api/shg/add-member', {
                email: memberEmail
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log(`[DEBUG] Member added successfully via API.`);
        } catch (err) {
            console.error('[DEBUG ERROR] addMember failed:', err.response?.data || err.message);
        }

        // 5. Member fetches profile
        const profileRes = await axios.get('http://localhost:5000/api/users/profile', {
            headers: { Authorization: `Bearer ${memberToken}` }
        });

        console.log('[DEBUG] Exact Member Profile Response:');
        console.log(JSON.stringify(profileRes.data, null, 2));

        // CLEANUP
        await User.deleteOne({ email: adminEmail });
        await User.deleteOne({ email: memberEmail });
        await SHG.deleteOne({ _id: shgRes.data._id });

        process.exit(0);
    } catch (error) {
        console.error('Error during test:', error.response?.data || error);
        process.exit(1);
    }
};

debugFlow();
