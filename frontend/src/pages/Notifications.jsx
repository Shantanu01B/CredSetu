import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdNotifications, MdCheckCircle, MdWarning, MdError, MdInfo } from 'react-icons/md';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <MdCheckCircle className="w-6 h-6 text-green-500" />;
            case 'warning': return <MdWarning className="w-6 h-6 text-orange-500" />;
            case 'error': return <MdError className="w-6 h-6 text-red-500" />;
            default: return <MdInfo className="w-6 h-6 text-blue-500" />;
        }
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notif.read;
        return notif.type === filter;
    });

    if (loading) return <div className="text-center p-10 text-gray-500">Loading...</div>;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 text-sm mt-1">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-3">
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                            Mark all as read
                        </button>
                    )}
                    <button onClick={fetchNotifications} className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {['all', 'unread', 'info', 'success', 'warning', 'error'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded text-sm font-medium capitalize ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                    <MdNotifications className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Notifications</h3>
                    <p className="text-gray-500 mt-1">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((notif) => (
                        <div 
                            key={notif._id} 
                            className={`p-4 rounded-lg border transition-all ${
                                !notif.read ? 'border-l-4 border-l-blue-500 shadow-sm bg-white' : 'bg-gray-50 border-gray-200 opacity-75'
                            } ${!notif.read ? 'cursor-pointer hover:shadow-md' : ''}`}
                            onClick={() => !notif.read && markAsRead(notif._id)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    {getTypeIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                                        <div>
                                            <h4 className={`font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className={`text-sm mt-1 ${!notif.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                                {notif.message}
                                            </p>
                                        </div>
                                        {notif.read && (
                                            <span className="shrink-0 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">Read</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">{new Date(notif.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
