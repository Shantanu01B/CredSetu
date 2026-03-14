const RiskAlert = require('../models/RiskAlert');
const User = require('../models/User');
const SHG = require('../models/SHG');
const Attendance = require('../models/Attendance');
const Transaction = require('../models/Transaction');

const generateRiskAlerts = async (shgId) => {
    // Clear existing alerts to avoid duplicates/stale alerts ??? 
    // Or just append? Requirement says "Trigger alerts". 
    // Usually alerts should be stateful (active/inactive) or log-based.
    // Given the constraints, let's clear old alerts for this SHG and regenerate simple snapshot alerts.
    // This prevents flooding the DB with duplicates every time a score updates.
    await RiskAlert.deleteMany({ shg: shgId });

    const shg = await SHG.findById(shgId);
    if (!shg) return;

    const members = await User.find({ shg: shgId });

    // 1. Group Level Risk
    if (shg.groupHealthScore < 50) {
        await RiskAlert.create({
            shg: shgId,
            type: 'Group Risk',
            message: `Group Health Score is critical (${shg.groupHealthScore})`,
            severity: 'high'
        });
    }

    // 2. Member Level Risks
    for (const member of members) {
        // A. Trust Score Risk
        if (member.trustScore < 60) {
            await RiskAlert.create({
                user: member._id,
                shg: shgId,
                type: 'Member Risk',
                message: `${member.name}: Trust Score is critically low (${member.trustScore})`,
                severity: 'high'
            });
        }

        // B. Repayment Risk (2+ Late Transactions)
        // Using "isLate" flag from transactions
        const lateTransactions = await Transaction.countDocuments({
            user: member._id,
            type: 'repayment',
            isLate: true
        });

        if (lateTransactions >= 2) {
            await RiskAlert.create({
                user: member._id,
                shg: shgId,
                type: 'Repayment Risk',
                message: `${member.name}: Has ${lateTransactions} late repayments`,
                severity: 'medium'
            });
        }

        // C. Engagement Risk (3 consecutive missed meetings)
        const attendance = await Attendance.find({ user: member._id }).sort({ meetingDate: -1 }).limit(3);
        let missedCount = 0;
        for (const record of attendance) {
            if (!record.present) missedCount++;
            else break; // Break if present
        }

        if (missedCount >= 3) {
            await RiskAlert.create({
                user: member._id,
                shg: shgId,
                type: 'Engagement Risk',
                message: `${member.name}: Missed last 3 meetings`,
                severity: 'low' // or medium? Requirement says "Low Engagement", implies low severity or is the name? Let's use Medium for 3 misses. Prompt says Color-coded badges... Red=High, Yellow=Medium, Blue=Low. Prompt doesn't map "Low Engagement" to a color explicitly. Let's start with Medium as it's -5 points.
                // Actually let's assume severity: 'medium' for engagement risk.
            });
        }
    }
};

module.exports = generateRiskAlerts;
