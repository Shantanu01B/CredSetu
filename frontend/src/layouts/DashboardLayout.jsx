import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
    const { user, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;

    return (
        <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
            <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header toggleSidebar={toggleMobileMenu} />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
