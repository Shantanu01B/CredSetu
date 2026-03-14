import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MemberDashboard = () => {
    const { user, refreshUserWithSHG, socket } = useAuth();
    const [loans, setLoans] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [trustHistory, setTrustHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeView, setTimeView] = useState('day');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Force a profile refresh to get the latest SHG assignment
                const updatedUser = await refreshUserWithSHG();

                if (!updatedUser?.shg) {
                    console.log("No SHG assigned yet");
                }

                try {
                    const { data: loanData } = await api.get('/loans/my');
                    setLoans(loanData);
                } catch {
                    console.log("No loans data");
                }

                try {
                    const { data: transactionData } = await api.get('/transactions/my');
                    setTransactions(transactionData);
                } catch {
                    console.log("No transactions data");
                }

                try {
                    const { data: historyData } = await api.get('/trust/history');
                    // Store the raw data to be formatted by the render cycle instead of pre-formatting
                    setTrustHistory(historyData);
                } catch {
                    console.log("No trust history");
                }
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?._id) fetchData();
    }, [user?._id, refreshUserWithSHG]);

    useEffect(() => {
        if (!socket) return;

        const handleTrustScoreUpdate = (data) => {
            console.log('[SOCKET] Trust Score Updated:', data);

            // Wait for refresh to complete so current user state is accurate
            refreshUserWithSHG().then((updatedUser) => {
                setTrustHistory(prev => {
                    return [...prev, {
                        createdAt: data.date,
                        score: data.score
                    }];
                });
            });
        };

        socket.on('trustScoreUpdated', handleTrustScoreUpdate);

        return () => {
            socket.off('trustScoreUpdated', handleTrustScoreUpdate);
        };
    }, [socket, refreshUserWithSHG]);

    if (loading) return <div className="text-center p-10 text-gray-500">Loading...</div>;

    const aggregateTrustTrend = () => {
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

        trustHistory.forEach(h => {
            const key = getFormatStr(h.createdAt);
            if (!aggregatedData[key] || aggregatedData[key]._ts < new Date(h.createdAt).getTime()) {
                // Keep the latest score for that period
                const label = timeView === 'day'
                    ? new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                aggregatedData[key] = { label, score: h.score, _ts: getSortTs(h.createdAt), _actualTs: new Date(h.createdAt).getTime() };
            }
        });

        const sortedData = Object.values(aggregatedData).sort((a, b) => a._ts - b._ts);

        // Ensure current score is reflected at the end if the last data point isn't current
        if (sortedData.length === 0 || sortedData[sortedData.length - 1].score !== user?.trustScore) {
            const fallbackLabel = timeView === 'day'
                ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            // If the label is the same as the last one, just update the score, otherwise append
            if (sortedData.length > 0 && sortedData[sortedData.length - 1].label === fallbackLabel) {
                sortedData[sortedData.length - 1].score = user?.trustScore || 100;
            } else {
                sortedData.push({ label: timeView === 'day' ? 'Now' : fallbackLabel, score: user?.trustScore || 100 });
            }
        }

        return sortedData.map(d => ({ date: d.label, score: d.score }));
    };

    const trendData = aggregateTrustTrend();

    const totalSavings = transactions.filter(t => t.type === 'saving' && t.verified).reduce((acc, curr) => acc + curr.amount, 0);
    const activeLoan = loans.find(l => l.status === 'approved' || l.status === 'pending');

    const handleDownloadReport = async () => {
        try {
            const response = await api.get(`/reports/member/${user._id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CredSetu_Report_${user.name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 rounded-lg p-6 lg:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                {/* Subtle light structure / glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="inline-block px-2.5 py-1 bg-white/10 rounded text-blue-200 text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/5">
                        Member Portal
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                        Welcome Back, {user?.name?.split(' ')[0] || 'Member'}
                    </h1>
                    <p className="text-slate-300 text-xs max-w-lg mt-1">
                        Monitor your financial metrics and track progress within your community network.
                    </p>
                </div>
                <button onClick={handleDownloadReport} className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded shadow-sm hover:bg-gray-100 focus:ring-2 focus:ring-slate-700 transition-all font-bold text-xs whitespace-nowrap border border-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trust Score</h3>
                            <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-bold text-slate-900">{user?.trustScore}</span>
                        </div>
                    </div>
                    <span className="mt-4 self-start text-[9px] font-extrabold uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">Excellent</span>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Savings</h3>
                            <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-bold text-slate-900">₹{totalSavings.toLocaleString()}</span>
                        </div>
                    </div>
                    <Link to="/savings" className="mt-4 font-bold text-[10px] uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">Add Savings &rarr;</Link>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Loan</h3>
                            <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        {activeLoan ? (
                            <div className="mt-2">
                                <span className="text-3xl font-bold text-slate-900">₹{activeLoan.remainingAmount.toLocaleString()}</span>
                                <div className="mt-2">
                                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${activeLoan.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                        {activeLoan.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-sm font-semibold text-gray-400">No active loans</div>
                        )}
                    </div>
                    {activeLoan ? (
                        <Link to="/repayment" className="mt-4 font-bold text-[10px] uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">Repay Loan &rarr;</Link>
                    ) : (
                        <Link to="/loans/request" className="mt-4 font-bold text-[10px] uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">Request Loan &rarr;</Link>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">My SHG</h3>
                            <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                        </div>
                        {user?.shg && typeof user.shg === 'object' ? (
                            <div className="mt-2">
                                <div className="text-sm font-bold text-slate-900 truncate" title={user.shg.name}>{user.shg.name}</div>
                                <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Fund: <span className="text-gray-900">₹{user.shg.totalFund.toLocaleString()}</span></div>
                            </div>
                        ) : user?.shg ? (
                            <div className="mt-2 text-sm font-medium text-gray-500 animate-pulse">Syncing details...</div>
                        ) : (
                            <div className="mt-2 text-sm font-medium text-gray-500">No group assigned</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trust Score Trend</h3>
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
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dy={10} />
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dx={-10} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '4px', border: 'none', color: '#fff', fontSize: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#334155" strokeWidth={2} dot={{ fill: '#fff', stroke: '#334155', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, strokeWidth: 0, fill: '#0f172a' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Transactions</h3>
                    <Link to="/history" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors">View All &rarr;</Link>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[500px]">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length > 0 ? (
                                transactions.slice(0, 5).map((t) => (
                                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5 text-xs text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                                        <td className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-700">{t.type}</td>
                                        <td className="px-5 py-3.5 text-xs font-bold text-slate-900">₹{t.amount.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${t.verified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                {t.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="px-5 py-8 text-center text-xs font-medium text-gray-400">No transactions found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;
