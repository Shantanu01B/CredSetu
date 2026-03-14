import { useState, useEffect } from 'react';
import { MdCheckCircle, MdPending, MdAccountBalanceWallet, MdMoneyOff, MdAttachMoney } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const FinancialHistory = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await api.get('/history/member');
                setHistory(data.timeline);
                setSummary(data.summary);
            } catch (error) {
                console.error("Error fetching financial history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user?._timestamp]);

    const filteredHistory = history.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'savings') return item.type === 'saving';
        if (filter === 'loans') return item.documentType === 'loan' || item.type === 'loan_disbursement';
        if (filter === 'repayments') return item.type === 'repayment';
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'saving': return <MdAccountBalanceWallet className="w-5 h-5 text-blue-500" />;
            case 'repayment': return <MdCheckCircle className="w-5 h-5 text-green-500" />;
            case 'loan_request': return <MdAttachMoney className="w-5 h-5 text-purple-500" />;
            case 'loan_disbursement': return <MdMoneyOff className="w-5 h-5 text-orange-500" />;
            default: return <MdAccountBalanceWallet className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
            case 'completed':
            case 'approved':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full capitalize">{status}</span>;
            case 'pending':
                return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full capitalize">{status}</span>;
            case 'rejected':
            case 'defaulted':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full capitalize">{status}</span>;
            default:
                return null;
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading your financial history...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Financial History</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-800 uppercase">Total Verified Savings</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">₹{summary?.totalSavings || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-sm font-medium text-purple-800 uppercase">Active Loan Balance</p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">₹{summary?.totalLoansActive || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-sm font-medium text-green-800 uppercase">Total Repaid</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">₹{summary?.totalRepaid || 0}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
                    {['all', 'savings', 'loans', 'repayments'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {filteredHistory.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                        <MdPending className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No financial records found in this category.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-8">
                        {filteredHistory.map((item) => (
                            <div key={item.id} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[35px] bg-white p-1 rounded-full border-2 border-slate-200">
                                    {getIcon(item.type)}
                                </div>

                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 capitalize">
                                                {item.type.replace('_', ' ')}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(item.date).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">₹{item.amount}</p>
                                            <div className="mt-1">{getStatusBadge(item.status)}</div>
                                        </div>
                                    </div>

                                    {(item.verifiedBy || item.approvedBy) && (
                                        <div className="mt-3 text-xs text-gray-500 bg-white p-2 rounded border">
                                            <span className="font-medium text-gray-700">Processed By:</span> {item.verifiedBy || item.approvedBy}
                                        </div>
                                    )}

                                    {item.remarks && (
                                        <div className="mt-2 text-sm text-gray-600 italic">
                                            "{item.remarks}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialHistory;
