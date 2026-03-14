const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const SHG = require('./models/SHG');
const Transaction = require('./models/Transaction');
const connectDB = require('./config/db');

dotenv.config({ path: './.env' });

const debugTransactionVerify = async () => {
    try {
        await connectDB();
        console.log('--- STARTING TRANSACTION VERIFY TEST ---');

        const adminEmail = `admin_tx_${Date.now()}@test.com`;
        const memberEmail = `member_tx_${Date.now()}@test.com`;

        // 1. Create Admin
        const adminRes = await axios.post('http://localhost:5000/api/users', {
            name: 'Debug Admin Tx',
            email: adminEmail,
            password: 'password123',
            role: 'admin'
        });
        const adminToken = adminRes.data.token;

        // 2. Create Member
        const memberRes = await axios.post('http://localhost:5000/api/users', {
            name: 'Debug Member Tx',
            email: memberEmail,
            password: 'password123',
            role: 'member'
        });
        const memberToken = memberRes.data.token;

        // 3. Admin creates SHG
        const shgRes = await axios.post('http://localhost:5000/api/shg', {
            name: `Debug SHG Tx ${Date.now()}`
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        console.log(`[DEBUG] SHG created: ${shgRes.data._id}`);

        // 4. Admin adds member
        await axios.put('http://localhost:5000/api/shg/add-member', {
            email: memberEmail
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        // Refresh Member Profile token state
        const profileRes = await axios.get('http://localhost:5000/api/users/profile', {
            headers: { Authorization: `Bearer ${memberToken}` }
        });

        // 5. Member adds savings
        const txRes = await axios.post('http://localhost:5000/api/transactions', {
            type: 'saving',
            amount: 500
        }, { headers: { Authorization: `Bearer ${memberToken}` } });

        console.log(`[DEBUG] Savings transaction created: ${txRes.data._id} (Verified: ${txRes.data.verified})`);

        // 6. Admin verifies transaction
        try {
            const verifyRes = await axios.put(`http://localhost:5000/api/transactions/${txRes.data._id}/verify`, {}, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`[DEBUG] Transaction verified successfully! Result:`);
            console.log(verifyRes.data);
        } catch (err) {
            console.error('[DEBUG ERROR] Admin verify failed:', err.response?.data || err.message);
        }

        // CLEANUP
        await User.deleteOne({ email: adminEmail });
        await User.deleteOne({ email: memberEmail });
        await SHG.deleteOne({ _id: shgRes.data._id });
        await Transaction.deleteOne({ _id: txRes.data._id });

        process.exit(0);
    } catch (error) {
        console.error('Error during test:', error.response?.data || error);
        process.exit(1);
    }
};

debugTransactionVerify();
