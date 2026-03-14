import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('member');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const getRedirectPath = (userRole) => {
        if (userRole === 'admin') return '/admin';
        if (userRole === 'bank_viewer') return '/bank/dashboard';
        return '/dashboard';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = await register(name, email, password, role);
            const redirectPath = getRedirectPath(userData.role);
            navigate(redirectPath);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    Cred<span className="text-blue-500">Setu</span>
                </h1>
                <p className="mt-3 text-sm font-medium text-slate-400 uppercase tracking-widest">
                    Empowering Financial Inclusion
                </p>
            </div>

            <h2 className="text-xl font-bold text-white mb-6 text-center">Create Your Account</h2>

            {error && (
                <div className="bg-red-500/10 text-red-400 border border-red-500/30 p-3 rounded-md mb-6 text-sm flex items-center justify-center shadow-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-md focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-white placeholder-slate-500"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-md focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-white placeholder-slate-500"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-md focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-white placeholder-slate-500"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                    <select
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-md focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-white focus:text-white"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="member" className="bg-slate-900 text-white">Member</option>
                        <option value="admin" className="bg-slate-900 text-white">Admin</option>
                        <option value="bank_viewer" className="bg-slate-900 text-white">Bank Viewer</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors mt-4 shadow-lg shadow-blue-500/20"
                >
                    Register Account
                </button>
            </form>
            <p className="mt-8 text-center text-sm text-slate-400">
                Already have an account? <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 hover:underline">Sign In</Link>
            </p>
        </div>
    );
};

export default Register;
