const axios = require('axios');

const testAPI = async () => {
    try {
        console.log('Testing server health...');
        const health = await axios.get('http://localhost:5000/');
        console.log('Health:', health.data);

        const email = `test_${Date.now()}@test.com`;
        const password = 'password123';

        console.log('Testing registration...');
        const regRes = await axios.post('http://localhost:5000/api/users', {
            name: 'Test User',
            email,
            password,
            role: 'member'
        });
        const token = regRes.data.token;
        console.log('Registration successful! Token received.');

        console.log('Testing profile fetch...');
        const profileRes = await axios.get('http://localhost:5000/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile fetch successful! SHG:', profileRes.data.shg);

    } catch (e) {
        if (e.response) {
            console.error('API Error:', e.response.status, e.response.data);
        } else {
            console.error('Network/Server Error:', e.message);
        }
    }
};

testAPI();
