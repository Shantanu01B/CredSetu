import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MdNotifications, MdCheckCircle, MdWarning, MdError, MdInfo, MdMenu } from 'react-icons/md';

const Header = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            } catch (error) {
                console.error('Error fetching notifications', error);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            const { data } = await api.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error marking notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            const { data } = await api.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return <MdCheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <MdWarning className="w-5 h-5 text-yellow-500" />;
            case 'error': return <MdError className="w-5 h-5 text-red-500" />;
            default: return <MdInfo className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between z-10 sticky top-0">
            <div className="flex items-center gap-3 md:gap-0">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <MdMenu className="w-6 h-6" />
                </button>
                <div>
                    <p className="hidden md:block text-sm text-gray-500">Welcome back,</p>
                    <h2 className="text-base md:text-lg font-semibold text-gray-800">{user?.name}</h2>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                    {user?.role}
                </span>

                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="relative p-2 text-gray-500 hover:text-gray-700"
                    >
                        <MdNotifications className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                            <div className="p-3 border-b flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                                ) : (
                                    notifications.slice(0, 10).map((notif) => (
                                        <div
                                            key={notif._id}
                                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                                            onClick={() => markAsRead(notif._id)}
                                        >
                                            <div className="flex gap-3">
                                                {getNotificationIcon(notif.type)}
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                                    <p className="text-xs text-gray-500">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(notif.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Link
                                to="/alerts"
                                className="block p-3 text-center text-sm text-blue-600 hover:underline border-t"
                                onClick={() => setShowDropdown(false)}
                            >
                                View All
                            </Link>
                        </div>
                    )}
                </div>

                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                    {user?.name?.charAt(0)}
                </div>
            </div>
        </header>
    );
};

export default Header;
