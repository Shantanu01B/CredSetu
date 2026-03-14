import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const getRedirectPath = (role) => {
        if (role === 'admin') return '/admin';
        if (role === 'bank_viewer') return '/bank/dashboard';
        return '/dashboard';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = await login(email, password);
            const redirectPath = getRedirectPath(userData.role);
            navigate(redirectPath);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
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
            <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In to Your Account</h2>
            {error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 p-3 rounded-md mb-6 text-sm flex items-center shadow-sm">{error}</div>}

            <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 text-center">Quick Login</p>
                <div className="flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => { setEmail('member1@test.com'); setPassword('111'); }}
                        className="px-4 py-2 text-xs font-semibold bg-slate-800/80 text-slate-300 rounded-md hover:bg-slate-700 transition-colors border border-slate-700/50 shadow-sm"
                    >
                        User
                    </button>
                    <button
                        type="button"
                        onClick={() => { setEmail('admin@test.com'); setPassword('333'); }}
                        className="px-4 py-2 text-xs font-semibold bg-blue-900/30 text-blue-300 rounded-md hover:bg-blue-800/50 transition-colors border border-blue-800/50 shadow-sm"
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => { setEmail('bank@test.com'); setPassword('444'); }}
                        className="px-4 py-2 text-xs font-semibold bg-indigo-900/30 text-indigo-300 rounded-md hover:bg-indigo-800/50 transition-colors border border-indigo-800/50 shadow-sm"
                    >
                        Bank
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors mt-4 shadow-lg shadow-blue-500/20"
                >
                    Sign In
                </button>
            </form>
            <p className="mt-8 text-center text-sm text-slate-400">
                Don't have an account? <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 hover:underline">Register</Link>
            </p>
        </div>
    );
};

export default Login;
