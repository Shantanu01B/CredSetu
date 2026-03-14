require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const { init } = require('./utils/socket');

// Routes
const userRoutes = require('./routes/userRoutes');
const shgRoutes = require('./routes/shgRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const trustScoreRoutes = require('./routes/trustScoreRoutes');
const riskRoutes = require('./routes/riskRoutes');
const otpRoutes = require('./routes/otpRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const bankRoutes = require('./routes/bankRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const historyRoutes = require('./routes/historyRoutes');

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/users', userRoutes);
app.use('/api/shg', shgRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/trust', trustScoreRoutes);
app.use('/api/alerts', riskRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
init(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
