import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminTransactionTable = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                let url = '/history/shg?';
                if (filterType) url += `type=${filterType}&`;
                if (filterStatus) url += `status=${filterStatus}&`;

                const { data } = await api.get(url);
                setTransactions(data.transactions);
            } catch (error) {
                console.error("Error fetching global ledger", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLedger();
    }, [filterType, filterStatus, user?._timestamp]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Global Ledger...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Global Ledger</h1>
                        <p className="text-sm text-gray-500 mt-1">Comprehensive audit trail of all SHG transactions.</p>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all font-medium"
                        >
                            <option value="">All Types</option>
                            <option value="saving">Savings</option>
                            <option value="repayment">Repayments</option>
                            <option value="loan_disbursement">Disbursements</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all font-medium"
                        >
                            <option value="">All Statuses</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Audited By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white text-sm">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                        No transactions found matching the current filters.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {tx.user?.name || 'Unknown'}
                                            <div className="text-xs text-gray-400 font-normal">{tx.user?.email}</div>
                                        </td>
                                        <td className="px-4 py-3 capitalize text-gray-700">
                                            {tx.type.replace('_', ' ')}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            ₹{tx.amount}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${tx.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {tx.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">
                                            {tx.verifiedBy?.name || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminTransactionTable;
