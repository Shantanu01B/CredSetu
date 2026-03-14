import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminFinanceOverview = () => {
    const { user } = useAuth();
    const [financeData, setFinanceData] = useState({ transactions: [], loans: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [timeView, setTimeView] = useState('day');

    useEffect(() => {
        const fetchFinanceData = async () => {
            try {
                const { data } = await api.get('/history/shg');
                setFinanceData(data);
            } catch (error) {
                console.error("Error fetching admin finance data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFinanceData();
    }, [user?._timestamp]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Finance Overview...</div>;

    const totalSavings = financeData.transactions.filter(t => t.type === 'saving' && t.verified).reduce((sum, t) => sum + t.amount, 0);
    const totalDisbursed = financeData.transactions.filter(t => t.type === 'loan_disbursement').reduce((sum, t) => sum + t.amount, 0);
    const totalRepayments = financeData.transactions.filter(t => t.type === 'repayment' && t.verified).reduce((sum, t) => sum + t.amount, 0);
    const outstandingLoans = financeData.loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.remainingAmount, 0);

    // Group transactions dynamically based on timeView state
    const aggregateCapitalTrend = () => {
        const aggregatedData = {};

        const getFormatStr = (dateString) => {
            if (timeView === 'day') {
                return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            } else {
                return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }
        };

        const getSortTs = (dateString) => {
            const d = new Date(dateString);
            if (timeView === 'day') {
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            } else {
                return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
            }
        };

        financeData.transactions.forEach(t => {
            const isSaving = t.type === 'saving' && t.verified;
            const isLoan = t.type === 'loan_disbursement';

            if (isSaving || isLoan) {
                const key = getFormatStr(t.createdAt);
                if (!aggregatedData[key]) {
                    const label = timeView === 'day'
                        ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                    aggregatedData[key] = { label, savings: 0, loans: 0, _ts: getSortTs(t.createdAt) };
                }
                if (isSaving) aggregatedData[key].savings += t.amount;
                if (isLoan) aggregatedData[key].loans += t.amount;
            }
        });

        const sortedData = Object.values(aggregatedData).sort((a, b) => a._ts - b._ts);

        let cumulativeSavings = 0;
        let cumulativeLoans = 0;

        const trend = sortedData.map(data => {
            cumulativeSavings += data.savings;
            cumulativeLoans += data.loans;
            return {
                label: data.label,
                savings: cumulativeSavings,
                loans: cumulativeLoans
            };
        });

        if (trend.length === 0) {
            const fallbackLabel = timeView === 'day'
                ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return [{ label: fallbackLabel, savings: 0, loans: 0 }];
        }
        return trend;
    };

    const trendData = aggregateCapitalTrend();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Holistic view of your SHG's physical capital and loan distributions.</p>
                </div>
                <Link to="/admin/transactions" className="px-4 py-2.5 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm">
                    View Global Ledger
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Verified Savings</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalSavings}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-orange-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Disbursed</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalDisbursed}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Repayments</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalRepayments}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-red-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Outstanding Loans</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{outstandingLoans}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Capital Trend</h3>
                    <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                        <button
                            onClick={() => setTimeView('day')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeView === 'day' ? 'bg-white text-slate-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-slate-700'}`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setTimeView('month')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeView === 'month' ? 'bg-white text-slate-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-slate-700'}`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                            <YAxis domain={['dataMin - 500', 'dataMax + 500']} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                            <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Total Savings" />
                            <Line type="monotone" dataKey="loans" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Loans Disbursed" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminFinanceOverview;
