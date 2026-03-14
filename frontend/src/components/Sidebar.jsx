import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MdDashboard,
    MdAttachMoney,
    MdAccountBalanceWallet,
    MdAdminPanelSettings,
    MdLogout,
    MdCalendarMonth,
    MdWarning,
    MdGroups,
    MdHistory,
    MdOutlineAccountBalance,
    MdReceiptLong
} from 'react-icons/md';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: MdDashboard, roles: ['member'] },
        { name: 'My History', path: '/history', icon: MdHistory, roles: ['member'] },
        { name: 'My Loans', path: '/loans', icon: MdOutlineAccountBalance, roles: ['member'] },
        { name: 'My Savings', path: '/savings', icon: MdAccountBalanceWallet, roles: ['member'] },
        { name: 'Request Loan', path: '/loans/request', icon: MdAttachMoney, roles: ['member'] },

        { name: 'Admin Panel', path: '/admin', icon: MdAdminPanelSettings, roles: ['admin'] },
        { name: 'Finance Audit', path: '/admin/finance', icon: MdOutlineAccountBalance, roles: ['admin'] },
        { name: 'Global Ledger', path: '/admin/transactions', icon: MdReceiptLong, roles: ['admin'] },

        { name: 'Bank Portal', path: '/bank/dashboard', icon: MdGroups, roles: ['bank_viewer'] },
        { name: 'Meetings', path: '/meetings', icon: MdCalendarMonth, roles: ['member', 'admin'] },
        { name: 'Risk Alerts', path: '/alerts', icon: MdWarning, roles: ['member', 'admin'] },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-20 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 to-indigo-950 text-white flex flex-col h-full shadow-xl transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 border-b border-white/10">
                    <h1 className="text-xl font-bold">CredSetu</h1>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        if (item.roles && !item.roles.includes(user?.role)) return null;
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all ${isActive ? 'bg-white/10 text-white border-l-2 border-indigo-400 font-medium' : 'text-indigo-100/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-indigo-200">
                            {user?.name?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white tracking-wide">{user?.name}</p>
                            <p className="text-xs text-indigo-200/70 capitalize font-medium">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-indigo-100/70 hover:bg-white/10 hover:text-red-400 transition-colors rounded font-medium"
                    >
                        <MdLogout className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
