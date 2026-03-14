import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdGroup, MdCheckCircle, MdWarning, MdSearch } from 'react-icons/md';

const BankDashboard = () => {
    const [shgs, setShgs] = useState([]);
    const [selectedShg, setSelectedShg] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAllSHGs = async () => {
            try {
                const { data } = await api.get('/shg/all');
                setShgs(data);
                if (data.length > 0) {
                    setSelectedShg(data[0]);
                    fetchShgStats(data[0]._id);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load SHGs');
            } finally {
                setLoading(false);
            }
        };
        fetchAllSHGs();
    }, []);

    const fetchShgStats = async (shgId) => {
        try {
            const { data } = await api.get(`/bank/shg/${shgId}`);
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleShgSelect = (shg) => {
        setSelectedShg(shg);
        fetchShgStats(shg._id);
    };

    const handleDownloadReport = async () => {
        try {
            const response = await api.get(`/reports/shg/${selectedShg._id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CredSetu_Bank_Report_${selectedShg.name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download report", error);
        }
    };

    const filteredShgs = shgs.filter(shg => shg.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getHealthColor = (score) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getHealthBg = (score) => {
        if (score >= 70) return 'bg-green-100';
        if (score >= 50) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-medium">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-lg p-6 lg:p-8 shadow-sm border border-slate-800">
                {/* Subtle light structure / glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-block px-2.5 py-1 bg-white/10 rounded text-blue-200 text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/5">
                            Bank Operations Portal
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Global SHG Registry</h1>
                        <p className="text-slate-300 text-xs mt-1">Monitor aggregated financial health across all Self Help Groups.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <div className="relative flex-1 md:w-72">
                            <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search groups by name..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded focus:bg-white focus:text-slate-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-white shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
                    <div className="p-4 border-b border-gray-200 bg-gray-50/80">
                        <h3 className="text-sm font-bold text-slate-900 flex justify-between items-center uppercase tracking-wider">
                            Directory
                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">{shgs.length}</span>
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredShgs.map((shg) => (
                            <div
                                key={shg._id}
                                onClick={() => handleShgSelect(shg)}
                                className={`p-3 rounded cursor-pointer transition-all border ${selectedShg?._id === shg._id ? 'bg-gradient-to-r from-slate-900 to-indigo-950 border-indigo-900 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className={`text-sm font-bold truncate ${selectedShg?._id === shg._id ? 'text-white' : 'text-slate-800'}`}>{shg.name}</h4>
                                        <p className={`text-[10px] font-medium mt-1 uppercase tracking-widest ${selectedShg?._id === shg._id ? 'text-blue-200' : 'text-gray-500'}`}>{shg.members?.length || 0} participants</p>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${selectedShg?._id === shg._id ? 'bg-white/20 text-white' :
                                        shg.groupHealthScore >= 70 ? 'bg-green-50 text-green-700 border border-green-200' :
                                            shg.groupHealthScore >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {shg.groupHealthScore || 0}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    {selectedShg && stats ? (
                        <>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/80">
                                    <div>
                                        <div className="inline-block px-2.5 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold tracking-widest uppercase mb-2 rounded">Selected Entity</div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedShg.name}</h2>
                                        <p className="text-gray-500 text-[11px] mt-1 font-semibold uppercase tracking-wider">Administrator: {selectedShg.admin?.name}</p>
                                    </div>
                                    <button onClick={handleDownloadReport} className="bg-white border border-gray-300 text-slate-700 px-4 py-2 rounded font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs shadow-sm focus:ring-2 focus:ring-slate-200">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Risk Report
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
                                    <div className="bg-white p-6">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Group Health</p>
                                        <p className={`text-3xl font-bold ${getHealthColor(stats.shgDetails.groupHealthScore)} drop-shadow-sm`}>
                                            {stats.shgDetails.groupHealthScore}
                                        </p>
                                    </div>
                                    <div className="bg-white p-6">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Total Fund</p>
                                        <p className="text-2xl font-bold text-slate-900 mt-1">₹{stats.shgDetails.totalFund?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-6">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Repayment Rate</p>
                                        <p className="text-2xl font-bold text-green-700 mt-1">{stats.financials.repaymentRatio}%</p>
                                    </div>
                                    <div className="bg-white p-6">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Avg Trust</p>
                                        <p className="text-2xl font-bold text-slate-700 mt-1">{stats.trustMetrics.avgMemberTrustScore}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                            <MdWarning className="text-red-600 w-5 h-5" />
                                        </div>
                                        Risk Watchlist <span className="text-sm px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 font-semibold">{stats.riskAnalysis.recentAlerts.length}</span>
                                    </h3>
                                    <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                                        {stats.riskAnalysis.recentAlerts.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                <MdCheckCircle className="w-12 h-12 text-green-200 mb-3" />
                                                <p className="font-medium text-slate-600">Zero active alerts</p>
                                                <p className="text-sm">Group is performing nominally</p>
                                            </div>
                                        ) : (
                                            stats.riskAnalysis.recentAlerts.slice(0, 5).map((alert) => (
                                                <div key={alert._id} className={`p-4 rounded-xl border-l-4 ${alert.severity === 'high' ? 'bg-white border-l-red-500 border-y border-r border-gray-100 shadow-sm' :
                                                    alert.severity === 'medium' ? 'bg-white border-l-orange-500 border-y border-r border-gray-100 shadow-sm' :
                                                        'bg-white border-l-yellow-500 border-y border-r border-gray-100 shadow-sm'
                                                    }`}>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">{alert.message}</p>
                                                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md mt-0.5 ${alert.severity === 'high' ? 'bg-red-50 text-red-700' :
                                                            alert.severity === 'medium' ? 'bg-orange-50 text-orange-700' :
                                                                'bg-yellow-50 text-yellow-700'
                                                            }`}>{alert.severity}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        Loan Portfolio
                                    </h3>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex justify-between items-center p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Disbursed</span>
                                            <span className="font-extrabold text-lg text-slate-900">₹{stats.financials.totalDisbursed?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-blue-50/50 rounded-xl border border-blue-50">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Loans</span>
                                            <span className="font-extrabold text-lg text-blue-700">{stats.financials.activeLoansCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-yellow-50/50 rounded-xl border border-yellow-50">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pending Requests</span>
                                            <span className="font-extrabold text-lg text-yellow-700">{stats.financials.pendingLoansCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-red-50/50 rounded-xl border border-red-50">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Defaults</span>
                                            <span className="font-extrabold text-lg text-red-700">{stats.financials.defaultedLoansCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-lg font-bold text-slate-900">Member Trust Scores</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[500px]">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-100">
                                                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Member</th>
                                                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Trust Index</th>
                                                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Standing</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {stats.trustMetrics.members.map((member) => (
                                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="font-bold text-slate-800">{member.name}</div>
                                                        <div className="text-xs text-gray-500 font-medium mt-0.5 capitalize">{member.role}</div>
                                                    </td>
                                                    <td className="py-4 px-6 font-extrabold text-slate-900 text-lg">{member.trustScore}</td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${member.trustScore >= 700 ? 'bg-green-50 text-green-700 border border-green-100' :
                                                            member.trustScore >= 500 ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                                'bg-red-50 text-red-700 border border-red-100'
                                                            }`}>
                                                            {member.trustScore >= 700 ? 'Creditworthy' : member.trustScore >= 500 ? 'Moderate' : 'High Risk'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center h-[calc(100vh-200px)] min-h-[500px] flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <MdGroup className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Entity Selected</h3>
                            <p className="text-gray-500 text-base max-w-sm mx-auto">Click on any Self Help Group in the directory panel to view comprehensive financial and risk analytics.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BankDashboard;
