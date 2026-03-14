import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdWarning, MdCheckCircle, MdError, MdInfo } from 'react-icons/md';

const RiskAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const { data } = await api.get('/alerts/my-shg');
                setAlerts(data);
            } catch (error) {
                console.error('Error fetching alerts', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high': return <MdError className="w-6 h-6 text-red-500" />;
            case 'medium': return <MdWarning className="w-6 h-6 text-orange-500" />;
            default: return <MdInfo className="w-6 h-6 text-yellow-500" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'bg-red-50 border-red-200';
            case 'medium': return 'bg-orange-50 border-orange-200';
            default: return 'bg-yellow-50 border-yellow-200';
        }
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-orange-100 text-orange-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const filteredAlerts = alerts.filter(alert => filter === 'all' || alert.severity === filter);

    if (loading) return <div className="text-center p-10 text-gray-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border">
                <h1 className="text-2xl font-bold text-gray-900">Risk Alerts</h1>
                <button onClick={() => window.location.reload()} className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Refresh</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3">
                        <MdWarning className="w-8 h-8 text-gray-400" />
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
                            <div className="text-xs text-gray-500">Total Alerts</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
                    <div className="flex items-center gap-3">
                        <MdError className="w-8 h-8 text-red-500" />
                        <div>
                            <div className="text-2xl font-bold text-red-600">{alerts.filter(a => a.severity === 'high').length}</div>
                            <div className="text-xs text-gray-500">High Risk</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                    <div className="flex items-center gap-3">
                        <MdWarning className="w-8 h-8 text-orange-500" />
                        <div>
                            <div className="text-2xl font-bold text-orange-600">{alerts.filter(a => a.severity === 'medium').length}</div>
                            <div className="text-xs text-gray-500">Medium Risk</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100">
                    <div className="flex items-center gap-3">
                        <MdInfo className="w-8 h-8 text-yellow-500" />
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.severity === 'low').length}</div>
                            <div className="text-xs text-gray-500">Low Risk</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {['all', 'high', 'medium', 'low'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded text-sm font-medium ${filter === f ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {filteredAlerts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                    <MdCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Risk Alerts</h3>
                    <p className="text-gray-500 mt-1">Your SHG is performing well!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAlerts.map((alert) => (
                        <div key={alert._id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                            <div className="flex items-start gap-4">
                                {getSeverityIcon(alert.severity)}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{alert.type}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getSeverityBadge(alert.severity)}`}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RiskAlerts;
