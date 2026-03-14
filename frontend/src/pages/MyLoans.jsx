import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyLoans = () => {
    const { user } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const { data } = await api.get('/history/member');
                // Extract only loans from the timeline
                const rawLoans = data.timeline.filter(t => t.documentType === 'loan');
                setLoans(rawLoans);
            } catch (error) {
                console.error("Error fetching loans", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLoans();
    }, [user?._timestamp]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading your loans...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
                    <p className="text-sm text-gray-500 mt-1">Track your active loans and repayment progress.</p>
                </div>
                <Link to="/loans/request" className="px-4 py-2.5 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm">
                    Request New Loan
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loans.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500 bg-white rounded-lg border">
                        <p>You have no loan history.</p>
                    </div>
                ) : (
                    loans.map((loan) => {
                        const remaining = loan.totalRepayable - (loan.repaidAmount || 0);
                        const progress = loan.totalRepayable > 0
                            ? Math.min(100, ((loan.repaidAmount || 0) / loan.totalRepayable) * 100)
                            : 0;

                        return (
                            <div key={loan.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Loan #{loan.id.slice(-6).toUpperCase()}</h3>
                                        <p className="text-xs text-gray-500 mt-1">Requested: {new Date(loan.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${loan.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                        loan.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {loan.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 border border-gray-100 rounded-md">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Principal</p>
                                        <p className="text-lg font-bold text-gray-900">₹{loan.amount}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 border border-gray-100 rounded-md">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
                                        <p className="text-lg font-bold text-purple-700">₹{remaining > 0 ? remaining : 0}</p>
                                    </div>
                                </div>

                                {loan.status === 'approved' && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Repayment Progress</span>
                                            <span className="font-medium text-gray-700">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-xs mt-1 text-gray-400">
                                            <span>₹{loan.repaidAmount || 0} Paid</span>
                                            <span>₹{loan.totalRepayable} Total</span>
                                        </div>
                                    </div>
                                )}

                                {loan.approvedBy && (
                                    <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex justify-between">
                                        <span>Approver: {loan.approvedBy}</span>
                                        {loan.status === 'approved' && (
                                            <Link to="/repayment" className="text-blue-600 font-medium hover:underline">Make Payment →</Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MyLoans;
