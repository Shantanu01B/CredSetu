import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md p-8 bg-gradient-to-br from-black via-[#0a0f18] to-[#041a3d] rounded-2xl shadow-2xl relative z-10 border border-slate-800 overflow-hidden">
                {/* Subtle light effects inside the card */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
