const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const SHG = require('../models/SHG');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const TrustScoreHistory = require('../models/TrustScoreHistory');
const RiskAlert = require('../models/RiskAlert');

// Helper to draw a professional enterprise header
const drawHeader = (doc, title, subtitle) => {
    // Top banner
    doc.rect(0, 0, doc.page.width, 100).fill('#0f172a');

    // Logo & Tagline
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('CredSetu', 50, 35);
    doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Empowering Financial Inclusion', 50, 65);

    // Move below banner
    doc.y = 140;

    // Report Title
    doc.fillColor('#0f172a').fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
    if (subtitle) {
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').fillColor('#64748b').text(subtitle, { align: 'center' });
    }

    doc.moveDown();
    // Divider line
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(2);
};

// Helper for section titles
const drawSectionTitle = (doc, title) => {
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b').text(title);
    doc.moveDown(0.5);
};

// Helper for key-value pairs
const drawKeyValue = (doc, key, value, color = '#334155', isLarge = false) => {
    const startY = doc.y;
    doc.font('Helvetica-Bold').fontSize(isLarge ? 12 : 11).fillColor('#64748b').text(`${key}:`, 50, startY, { continued: true, width: 200 });
    doc.font(isLarge ? 'Helvetica-Bold' : 'Helvetica').fillColor(color).text(` ${value}`);
    doc.moveDown(0.3);
};

// @desc    Generate Member Financial Report
// @route   GET /api/reports/member/:userId
// @access  Private
const getMemberReport = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId).populate('shg');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Security check: Users can only download their own report unless admin
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized');
    }

    const loans = await Loan.find({ user: user._id });
    const transactions = await Transaction.find({ user: user._id, verified: true });
    const trustHistory = await TrustScoreHistory.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);

    // Attendance Calc
    const Attendance = require('../models/Attendance');
    const Meeting = require('../models/Meeting');
    const allShgMeetings = await Meeting.find({ shg: user.shg?._id });
    const presentCount = await Attendance.countDocuments({ user: user._id, present: true });
    const attendanceRate = allShgMeetings.length > 0 ? Math.min(100, Math.round((presentCount / allShgMeetings.length) * 100)) : 0;

    const totalSavings = transactions
        .filter(t => t.type === 'saving')
        .reduce((acc, t) => acc + t.amount, 0);

    const activeLoan = loans.find(l => l.status === 'approved');

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CredSetu_Report_${user.name}.pdf`);

    doc.pipe(res);

    drawHeader(doc, 'Member Financial Report', `Generated on ${new Date().toLocaleDateString()}`);

    // ----- Member Profile -----
    drawSectionTitle(doc, 'Member Profile');
    drawKeyValue(doc, 'Name', user.name);
    drawKeyValue(doc, 'Email', user.email);
    drawKeyValue(doc, 'Affiliated SHG', user.shg ? user.shg.name : 'Not Assigned');
    drawKeyValue(doc, 'Member Since', new Date(user.createdAt).toLocaleDateString());
    drawKeyValue(doc, 'Attendance Rate', `${attendanceRate}%`);

    // ----- Trust Score -----
    drawSectionTitle(doc, 'Trust & Reliability Analysis');
    const scoreColor = user.trustScore >= 700 ? '#16a34a' : (user.trustScore >= 500 ? '#ea580c' : '#dc2626');
    drawKeyValue(doc, 'Current Trust Score', user.trustScore.toString(), scoreColor, true);

    if (trustHistory.length > 0) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#64748b').text('Recent Score Adjustments:');
        doc.moveDown(0.2);
        trustHistory.forEach(h => {
            doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`• ${h.score} pts \u2014 ${h.reason} (Date: ${new Date(h.createdAt).toLocaleDateString()})`, { indent: 15 });
            doc.moveDown(0.2);
        });
    }

    // ----- Financial Portfolio -----
    doc.y = Math.max(doc.y, 450); // Ensure it doesn't overlap weirdly
    drawSectionTitle(doc, 'Financial Summary');
    drawKeyValue(doc, 'Total Lifetime Savings', `Rs. ${totalSavings.toLocaleString()}`);

    if (activeLoan) {
        drawKeyValue(doc, 'Active Loan Disbursed', `Rs. ${activeLoan.amount.toLocaleString()}`);
        drawKeyValue(doc, 'Outstanding Balance', `Rs. ${activeLoan.remainingAmount.toLocaleString()}`);
        drawKeyValue(doc, 'Loan Status', activeLoan.status.toUpperCase(), '#0ea5e9');
    } else {
        drawKeyValue(doc, 'Active Liabilities', 'None', '#16a34a');
    }

    // ----- Recent Ledger -----
    doc.addPage();
    drawHeader(doc, 'Transaction Ledger', `Member: ${user.name}`);

    drawSectionTitle(doc, 'Recent Verified Transactions');
    doc.moveDown(0.5);

    const recentTxns = transactions.sort((a, b) => b.createdAt - a.createdAt).slice(0, 15);

    if (recentTxns.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(11).fillColor('#94a3b8').text('No verified transactions on record.');
    } else {
        // Table Header
        const startY = doc.y;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
        doc.text('DATE', 50, startY);
        doc.text('TYPE', 200, startY);
        doc.text('AMOUNT', 350, startY);
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor('#cbd5e1').lineWidth(1).stroke();
        doc.moveDown(1);

        recentTxns.forEach(t => {
            const y = doc.y;
            doc.font('Helvetica').fontSize(10).fillColor('#334155');
            doc.text(new Date(t.createdAt).toLocaleDateString(), 50, y);
            doc.text(t.type.toUpperCase(), 200, y);
            doc.font('Helvetica-Bold').text(`Rs. ${t.amount.toLocaleString()}`, 350, y);
            doc.moveDown(0.6);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#f1f5f9').lineWidth(1).stroke();
            doc.moveDown(0.6);
        });
    }

    // Footer
    doc.fontSize(9).font('Helvetica').fillColor('#cbd5e1').text('This document is a certified, system-generated report by CredSetu.', 50, doc.page.height - 50, { align: 'center' });

    doc.end();
});

// @desc    Generate SHG Performance Report
// @route   GET /api/reports/shg/:shgId
// @access  Private/Admin
const getSHGReport = asyncHandler(async (req, res) => {
    const shg = await SHG.findById(req.params.shgId).populate('members');
    if (!shg) {
        res.status(404);
        throw new Error('SHG not found');
    }

    // Security check: Only admin or bank viewer
    if (req.user.role !== 'admin' && req.user.role !== 'bank_viewer') {
        res.status(401);
        throw new Error('Not authorized');
    }

    const loans = await Loan.find({ shg: shg._id });
    const riskAlerts = await RiskAlert.find({ shg: shg._id }).sort({ createdAt: -1 }).limit(10);

    const totalLoans = loans.reduce((acc, l) => acc + l.amount, 0);
    const activeLoans = loans.filter(l => l.status === 'approved');
    const defaultedLoans = loans.filter(l => l.status === 'defaulted');

    const outstandingCapital = activeLoans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0);
    const defaultedCapital = defaultedLoans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0);

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CredSetu_SHG_Report_${shg.name}.pdf`);

    doc.pipe(res);

    drawHeader(doc, 'SHG Institutional Performance Report', `Entity: ${shg.name} | Date: ${new Date().toLocaleDateString()}`);

    // ----- SHG Institutional Overview -----
    drawSectionTitle(doc, 'Entity Overview');
    drawKeyValue(doc, 'Registered Name', shg.name);
    drawKeyValue(doc, 'Total Active Members', shg.members.length.toString());
    drawKeyValue(doc, 'Total Vault Capital', `Rs. ${shg.totalFund.toLocaleString()}`, '#0f172a', true);

    let healthColor = '#16a34a';
    if ((shg.groupHealthScore || 0) < 50) healthColor = '#dc2626';
    else if ((shg.groupHealthScore || 0) < 70) healthColor = '#ea580c';

    drawKeyValue(doc, 'Group Health Index', (shg.groupHealthScore || 'N/A').toString(), healthColor, true);
    drawKeyValue(doc, 'Avg Member Trust Score', (shg.groupTrustScore || 'N/A').toString());

    // ----- Loan Portfolio Diagnostics -----
    drawSectionTitle(doc, 'Credit Portfolio Diagnostics');
    drawKeyValue(doc, 'Total Capital Disbursed', `Rs. ${totalLoans.toLocaleString()}`);
    drawKeyValue(doc, 'Active Accounts', activeLoans.length.toString());
    drawKeyValue(doc, 'Capital at Risk (Outstanding)', `Rs. ${outstandingCapital.toLocaleString()}`, '#ea580c');
    drawKeyValue(doc, 'Defaulted Accounts', defaultedLoans.length.toString(), defaultedLoans.length > 0 ? '#dc2626' : '#16a34a');
    drawKeyValue(doc, 'Capital Lost (Defaulted)', `Rs. ${defaultedCapital.toLocaleString()}`, defaultedCapital > 0 ? '#dc2626' : '#16a34a');

    // ----- Risk Analysis Logs -----
    doc.addPage();
    drawHeader(doc, 'Institutional Risk Ledger', `Entity: ${shg.name}`);
    drawSectionTitle(doc, 'Recent Risk & Alert Signals');

    if (riskAlerts.length > 0) {
        riskAlerts.forEach(alert => {
            const color = alert.severity === 'high' ? '#dc2626' : (alert.severity === 'medium' ? '#ea580c' : '#ca8a04');
            const bg = alert.severity === 'high' ? '#fef2f2' : (alert.severity === 'medium' ? '#fff7ed' : '#fefce8');

            doc.moveDown(0.3);
            doc.rect(50, doc.y, 495, 25).fill(bg);
            doc.font('Helvetica-Bold').fontSize(10).fillColor(color).text(`[${alert.severity.toUpperCase()}]`, 60, doc.y + 7, { continued: true });
            doc.font('Helvetica').fillColor('#334155').text(` ${alert.message} (${new Date(alert.createdAt).toLocaleDateString()})`);
            doc.moveDown(0.8);
        });
    } else {
        doc.font('Helvetica-Oblique').fontSize(11).fillColor('#16a34a').text('No systemic risks or default alerts flagged within the network.');
    }

    // Footer
    doc.fontSize(9).font('Helvetica').fillColor('#cbd5e1').text('This document is a certified, system-generated institutional overview by CredSetu.', 50, doc.page.height - 50, { align: 'center' });

    doc.end();
});

module.exports = { getMemberReport, getSHGReport };

