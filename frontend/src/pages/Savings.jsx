import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Savings = () => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [transactions, setTransactions] = useState([]);

    const fetchTransactions = async () => {
        try {
            const { data } = await api.get('/transactions/my');
            setTransactions(data.filter(t => t.type === 'saving'));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user?._timestamp]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.shg) {
            setMessage('error:You need to be part of an SHG to add savings');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            await api.post('/transactions', { type: 'saving', amount: Number(amount) });
            setMessage('success:Savings added successfully!');
            setAmount('');
            fetchTransactions();
        } catch (err) {
            setMessage('error:' + (err.response?.data?.message || 'Failed to add savings'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Add Savings</h2>
                {message && (
                    <div className={`p-3 rounded mb-4 text-sm ${message.startsWith('success:') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {message.replace(/^(success|error):/, '')}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
                        <input
                            type="number"
                            required
                            min="10"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-800 text-white py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Deposit Savings'}
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Savings History</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {transactions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No savings history found.</p>
                    ) : (
                        transactions.map(t => (
                            <div key={t._id} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-md">
                                <div>
                                    <p className="font-bold text-gray-900">₹{t.amount}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${t.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {t.verified ? 'Verified' : 'Pending'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Savings;
