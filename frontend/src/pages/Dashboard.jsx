import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Trust Score</h3>
                    <div className="mt-2 text-3xl font-bold text-gray-800">{user?.trustScore || 100}</div>
                    <p className="text-sm text-green-600 mt-1">+5 points this month</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Total Savings</h3>
                    <div className="mt-2 text-3xl font-bold text-gray-800">₹5,000</div>
                    <Link to="/savings" className="text-sm text-blue-600 hover:underline mt-2 block">Add Savings →</Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Active Loan</h3>
                    <div className="mt-2 text-3xl font-bold text-gray-800">None</div>
                    <Link to="/loans/request" className="text-sm text-blue-600 hover:underline mt-2 block">Apply for loan →</Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr>
                            <td className="px-6 py-4 text-sm text-gray-600">Oct 24, 2023</td>
                            <td className="px-6 py-4 text-sm text-gray-800">Weekly Saving</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">₹100</td>
                            <td className="px-6 py-4 text-sm text-green-600">Completed</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-sm text-gray-600">Oct 17, 2023</td>
                            <td className="px-6 py-4 text-sm text-gray-800">Weekly Saving</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">₹100</td>
                            <td className="px-6 py-4 text-sm text-green-600">Completed</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
