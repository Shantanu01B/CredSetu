import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MdInfo } from 'react-icons/md';

const LoanRequest = () => {
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('12');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const interestRate = 0.02;

    const calculateEMI = (principal, months, rate) => {
        if (!principal || !months) return 0;
        const r = rate;
        const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
        return Math.round(emi);
    };

    const totalRepayable = amount ? Number(amount) * (1 + interestRate * Number(duration)) : 0;
    const emi = calculateEMI(Number(amount), Number(duration), interestRate);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.shg) {
            setError('You need to be part of an SHG to request a loan');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/loans', { amount: Number(amount), durationMonths: Number(duration) });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit loan request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Request a Loan</h2>

                <div className="mb-6 p-4 bg-blue-50 rounded flex items-start gap-3">
                    <MdInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Your Trust Score: {user?.trustScore}</p>
                        <p>Higher trust scores may help with loan approval.</p>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="100"
                                max="500000"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1.5">Min: ₹100 - Max: ₹5,00,000</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (Months)</label>
                            <select
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            >
                                <option value="3">3 Months</option>
                                <option value="6">6 Months</option>
                                <option value="9">9 Months</option>
                                <option value="12">12 Months</option>
                                <option value="18">18 Months</option>
                                <option value="24">24 Months</option>
                            </select>
                        </div>
                    </div>

                    {amount && (
                        <div className="bg-gray-50 rounded p-4 border">
                            <h3 className="font-semibold text-gray-800 mb-3">Loan Calculator</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-white rounded border">
                                    <p className="text-xs text-gray-500 uppercase">Principal</p>
                                    <p className="text-lg font-bold text-gray-800">₹{Number(amount).toLocaleString()}</p>
                                </div>
                                <div className="text-center p-3 bg-white rounded border">
                                    <p className="text-xs text-gray-500 uppercase">Interest</p>
                                    <p className="text-lg font-bold text-gray-800">2% /month</p>
                                </div>
                                <div className="text-center p-3 bg-white rounded border">
                                    <p className="text-xs text-gray-500 uppercase">Monthly EMI</p>
                                    <p className="text-lg font-bold text-blue-600">₹{emi.toLocaleString()}</p>
                                </div>
                                <div className="text-center p-3 bg-white rounded border">
                                    <p className="text-xs text-gray-500 uppercase">Total Repayment</p>
                                    <p className="text-lg font-bold text-green-600">₹{Math.round(totalRepayable).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded p-4 text-sm text-gray-600">
                        <p className="font-medium mb-2">Loan Terms:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Interest Rate: 2% per month</li>
                            <li>Processing Fee: None</li>
                            <li>Early repayment allowed without penalty</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !amount}
                        className="w-full bg-slate-800 text-white py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Loan Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoanRequest;
