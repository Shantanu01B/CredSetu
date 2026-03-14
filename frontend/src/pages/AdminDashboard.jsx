import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user, refreshUserWithSHG } = useAuth();
    const [shg, setShg] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [shgName, setShgName] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    // Meetings State
    const [meetings, setMeetings] = useState([]);
    const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
    const [newMeeting, setNewMeeting] = useState({ title: '', meetingDate: '', description: '', absentees: [] });

    const fetchSHGData = async () => {
        try {
            const { data: shgData } = await api.get('/shg');
            setShg(shgData);

            if (shgData._id) {
                try {
                    const { data: txData } = await api.get('/transactions/shg');
                    setTransactions(txData);
                } catch {
                    setTransactions([]);
                }

                try {
                    const { data: loanData } = await api.get('/loans/shg');
                    setLoans(loanData);
                } catch {
                    setLoans([]);
                }

                try {
                    const { data: meetingData } = await api.get('/attendance/meetings');
                    setMeetings(meetingData);
                } catch {
                    setMeetings([]);
                }
            }
            return true;
        } catch {
            console.log("No SHG found for this admin");
            setShg(null);
            return false;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await refreshUserWithSHG();
            await fetchSHGData();
            setLoading(false);
        };
        if (user?._id) fetchData();
    }, [user?._id, user?._timestamp, refreshUserWithSHG]);

    const handleCreateSHG = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await api.post('/shg', { name: shgName });
            setMessage({ type: 'success', text: 'SHG Created Successfully' });
            await refreshUserWithSHG();
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create SHG' });
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            const { data: updatedSHG } = await api.put('/shg/add-member', { email: newMemberEmail });
            setMessage({ type: 'success', text: 'Member Added Successfully' });
            setNewMemberEmail('');
            setShg(updatedSHG);
            await refreshUserWithSHG();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add member' });
        }
    };

    const handleVerifyMember = async (memberId, currentStatus) => {
        try {
            await api.put('/shg/verify-member', { memberId, isVerified: !currentStatus });
            await fetchSHGData();
            await refreshUserWithSHG();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update verification' });
        }
    };

    const handleVerifyTransaction = async (id) => {
        try {
            setMessage({ type: '', text: '' });
            await api.put(`/transactions/${id}/verify`, {});
            setMessage({ type: 'success', text: 'Transaction verified successfully!' });
            await fetchSHGData();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to verify transaction' });
        }
    };

    const handleLoanAction = async (id, status) => {
        try {
            await api.put(`/loans/${id}/status`, { status });
            toast.success(`Loan ${status} successfully!`);
            await fetchSHGData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to process loan action');
        }
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            await api.post('/attendance/meetings', {
                title: newMeeting.title,
                meetingDate: newMeeting.meetingDate,
                description: newMeeting.description,
                absentMembers: newMeeting.absentees
            });
            toast.success('Meeting created and attendance logged successfully!');
            setIsCreatingMeeting(false);
            setNewMeeting({ title: '', meetingDate: '', description: '', absentees: [] });
            await fetchSHGData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create meeting');
        }
    };

    const toggleAbsentee = (memberId) => {
        setNewMeeting(prev => {
            const isAbsent = prev.absentees.includes(memberId);
            if (isAbsent) {
                return { ...prev, absentees: prev.absentees.filter(id => id !== memberId) };
            } else {
                return { ...prev, absentees: [...prev.absentees, memberId] };
            }
        });
    };

    if (loading) return <div className="text-center p-10 text-gray-500">Loading...</div>;

    if (!user?.shg && !shg) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Create Your Community</h2>
                    <p className="text-gray-500 text-sm mb-6">Initialize a new Self Help Group to start managing members and finances automatically.</p>

                    {message.text && (
                        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleCreateSHG} className="space-y-4">
                        <div className="text-left">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Group Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Mahila Vikas Samiti"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                value={shgName}
                                onChange={(e) => setShgName(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">Launch Group</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Admin Hero Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-lg p-6 lg:p-8 shadow-sm flex flex-col justify-between border border-slate-800">
                    {/* Subtle light structure / glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="inline-block px-2.5 py-1 bg-white/10 rounded text-blue-200 text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/5">
                            Admin Control Panel
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{shg?.name}</h2>
                        <div className="flex items-center gap-4 text-slate-300 text-xs mt-3">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Active Status</span>
                            <span className="flex items-center gap-1.5 text-blue-200"><div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-blue-400"></div></div> Trust Score: {shg?.groupTrustScore}</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between mt-6 pt-5 border-t border-white/10 gap-4">
                        <div>
                            <p className="text-blue-200/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Vault Fund</p>
                            <p className="text-2xl md:text-3xl font-bold text-white">₹{shg?.totalFund?.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await api.get(`/reports/shg/${shg._id}`, { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `CredSetu_SHG_Report_${shg.name}.pdf`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                } catch (error) {
                                    console.error(error);
                                }
                            }}
                            className="flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg text-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Generate Report
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                        <svg className={`w-6 h-6 ${(shg?.groupHealthScore || 0) >= 80 ? 'text-green-600' : (shg?.groupHealthScore || 0) >= 60 ? 'text-blue-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h2 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Group Health Index</h2>
                    <div className={`text-4xl font-bold tracking-tight mb-2 ${(shg?.groupHealthScore || 0) >= 80 ? 'text-green-700' :
                        (shg?.groupHealthScore || 0) >= 60 ? 'text-blue-700' :
                            (shg?.groupHealthScore || 0) >= 40 ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                        {shg?.groupHealthScore || 0}
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded border ${(shg?.groupHealthScore || 0) >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                        (shg?.groupHealthScore || 0) >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            (shg?.groupHealthScore || 0) >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {(shg?.groupHealthScore || 0) >= 80 ? 'Excellent' :
                            (shg?.groupHealthScore || 0) >= 60 ? 'Good' :
                                (shg?.groupHealthScore || 0) >= 40 ? 'Moderate' : 'Risky'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 border-b border-gray-100 pb-4">Network Settings</h3>
                    {message.text && (
                        <div className={`p-4 rounded-lg mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {message.text}
                        </div>
                    )}
                    <form onSubmit={handleAddMember} className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Provision Member Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-sm text-sm">Send Invitation</button>
                    </form>

                    <div className="flex-1 mt-2">
                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            Roster
                            <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">{shg?.members?.length}</span>
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600 overflow-y-auto" style={{ maxHeight: '280px' }}>
                            {shg?.members?.map(m => (
                                <li key={m._id} className="flex justify-between items-center p-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${m.trustScore >= 700 ? 'bg-green-50 text-green-700 border-green-200' :
                                                m.trustScore >= 500 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {m.trustScore}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-gray-500 font-medium">{m.email}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <button
                                            onClick={() => handleVerifyMember(m._id, m.isVerified)}
                                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors w-full border ${m.isVerified
                                                ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}`}
                                        >
                                            {m.isVerified ? 'Revoke' : 'Approve'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6 h-full flex flex-col">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/80">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Loan Underwriting Queue</h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200">
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Applicant</th>
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Principal</th>
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">+Interest</th>
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Verdict</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {loans.filter(l => l.status === 'pending').length === 0 && (
                                        <tr><td colSpan="4" className="py-8 text-center text-gray-400 font-medium">Clear queue. No pending applications.</td></tr>
                                    )}
                                    {loans.filter(l => l.status === 'pending').map(loan => (
                                        <tr key={loan._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3.5 px-5 text-xs font-semibold text-slate-800">{loan.user?.name}</td>
                                            <td className="py-3.5 px-5 text-xs font-bold text-slate-900">₹{loan.amount.toLocaleString()}</td>
                                            <td className="py-3.5 px-5 text-xs text-gray-500 font-medium">₹{loan.totalRepayable.toLocaleString()}</td>
                                            <td className="py-3.5 px-5 flex items-center gap-2">
                                                <button onClick={() => handleLoanAction(loan._id, 'approved')} className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-slate-900 hover:bg-slate-800 transition-colors">Approve</button>
                                                <button onClick={() => handleLoanAction(loan._id, 'rejected')} className="px-3 py-1.5 bg-white text-gray-600 border border-gray-300 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-gray-50 hover:text-slate-900 transition-colors">Decline</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/80">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Transaction Verification Ledger</h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200">
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Member</th>
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                                        <th className="py-3 px-5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {transactions.filter(t => !t.verified).length === 0 && (
                                        <tr><td colSpan="5" className="py-8 text-center text-gray-400 font-medium">Ledger up to date. No pending verifications.</td></tr>
                                    )}
                                    {transactions.filter(t => !t.verified).map(tx => (
                                        <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3.5 px-5 text-xs text-gray-500 font-medium">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                            <td className="py-3.5 px-5 text-xs font-semibold text-slate-800">{tx.user?.name}</td>
                                            <td className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-600">{tx.type}</td>
                                            <td className="py-3.5 px-5 text-xs font-bold text-slate-900">₹{tx.amount.toLocaleString()}</td>
                                            <td className="py-3.5 px-5">
                                                <button onClick={() => handleVerifyTransaction(tx._id)} className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-slate-900 hover:bg-slate-800 transition-colors">Authorize</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meetings Management Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/80 flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">Meetings & Attendance</h3>
                        <p className="text-xs text-gray-500 mt-1">Schedule group meetings and log member attendance.</p>
                    </div>
                    <button
                        onClick={() => setIsCreatingMeeting(!isCreatingMeeting)}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        {isCreatingMeeting ? 'Cancel' : 'Create Meeting'}
                    </button>
                </div>

                {isCreatingMeeting ? (
                    <div className="p-6 border-b border-indigo-100 bg-indigo-50/30">
                        <form onSubmit={handleCreateMeeting} className="max-w-3xl space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Meeting Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                                        value={newMeeting.title}
                                        onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                        placeholder="e.g. March Weekly Collection"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                                        value={newMeeting.meetingDate}
                                        onChange={(e) => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm resize-none"
                                    rows="2"
                                    value={newMeeting.description}
                                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                                    placeholder="Brief agenda or notes..."
                                />
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-slate-900">Mark Attendance</h4>
                                    <p className="text-xs text-gray-500 mt-1">By default, all members are marked <span className="text-green-600 font-bold">Present</span>. Toggle to mark individuals as Absent.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {shg?.members?.map(m => {
                                        const isAbsent = newMeeting.absentees.includes(m._id);
                                        return (
                                            <div
                                                key={m._id}
                                                onClick={() => toggleAbsentee(m._id)}
                                                className={`cursor-pointer p-3 border rounded-lg flex items-center justify-between transition-all ${isAbsent ? 'bg-red-50 border-red-200' : 'bg-green-50/50 border-green-200'
                                                    }`}
                                            >
                                                <div className="text-sm font-semibold text-slate-800">{m.name}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isAbsent ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                                                    }`}>
                                                    {isAbsent ? 'Absent' : 'Present'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold shadow-md rounded-lg hover:bg-slate-800 transition-all">Submit Meeting & Log Attendance</button>
                            </div>
                        </form>
                    </div>
                ) : null}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white border-b border-gray-200">
                                <th className="py-3 px-6 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="py-3 px-6 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Title</th>
                                <th className="py-3 px-6 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {meetings.length === 0 ? (
                                <tr><td colSpan="3" className="py-8 text-center text-gray-400 font-medium">No meetings scheduled yet.</td></tr>
                            ) : (
                                meetings.map(meeting => (
                                    <tr key={meeting._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 text-xs text-gray-500 font-medium whitespace-nowrap">
                                            {new Date(meeting.meetingDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-semibold text-slate-800">{meeting.title}</td>
                                        <td className="py-4 px-6 text-xs text-gray-600">{meeting.description || '-'}</td>
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

export default AdminDashboard;
