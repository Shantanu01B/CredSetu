import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Meetings = () => {
    const { user, socket } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [groupStats, setGroupStats] = useState([]);

    // Meeting Form
    const [meetingForm, setMeetingForm] = useState({
        title: 'Monthly Meeting',
        meetingDate: new Date().toISOString().split('T')[0],
        description: '',
        location: ''
    });

    const [memberStatus, setMemberStatus] = useState({});
    const [shgMembers, setShgMembers] = useState([]);

    const isAdmin = user?.role === 'admin';

    const fetchData = async () => {
        try {
            const { data: meetingsData } = await api.get('/attendance/meetings');
            setMeetings(meetingsData);

            if (isAdmin) {
                const { data: shgData } = await api.get('/shg');
                setShgMembers(shgData.members || []);
                try {
                    const { data: statsData } = await api.get('/attendance/stats');
                    setGroupStats(statsData);
                } catch (err) {
                    console.error('Failed to fetch group stats', err);
                }
            } else {
                const { data: attData } = await api.get('/attendance/my');
                setAttendance(attData);
            }
        } catch (error) {
            console.error('Error fetching meetings', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAdmin]);

    // Real-time listener for attendance updates
    useEffect(() => {
        if (!socket) return;

        socket.on('attendanceMarked', () => {
            fetchData();
        });

        return () => {
            socket.off('attendanceMarked');
        };
    }, [socket]);

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            await api.post('/attendance/meetings', meetingForm);
            setShowMeetingModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating meeting', error);
        }
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        try {
            const records = Object.entries(memberStatus).map(([userId, present]) => ({ userId, present }));
            await api.post('/attendance/mark', { meetingId: selectedMeeting._id, records });
            setShowAttendanceModal(false);
            setSelectedMeeting(null);
            setMemberStatus({});
            fetchData();
        } catch (error) {
            console.error('Error marking attendance', error);
        }
    };

    const openAttendanceModal = async (meeting) => {
        setSelectedMeeting(meeting);
        setShowAttendanceModal(true);

        try {
            const { data } = await api.get(`/attendance/shg/${meeting._id}`);
            const initialStatus = {};

            if (data && data.length > 0) {
                // If attendance was already marked previously, load the saved state
                shgMembers.forEach(m => {
                    const record = data.find(a => (a.user?._id === m._id) || (a.user === m._id));
                    initialStatus[m._id] = record ? record.present : false;
                });
            } else {
                // If it's the very first time marking this meeting, default everyone to present
                shgMembers.forEach(m => {
                    initialStatus[m._id] = true;
                });
            }
            setMemberStatus(initialStatus);
        } catch (error) {
            console.error('Error fetching attendance data', error);
            const fallbackStatus = {};
            shgMembers.forEach(m => { fallbackStatus[m._id] = true; });
            setMemberStatus(fallbackStatus);
        }
    };

    const getAttendanceRate = () => {
        if (isAdmin) return 100; // Admin doesn't track self usually? 
        if (meetings.length === 0) return 0;
        const present = attendance.filter(a => a.present).length;
        return Math.round((present / meetings.length) * 100);
    };

    if (loading) return <div className="text-center p-10 text-gray-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border">
                <h1 className="text-2xl font-bold text-gray-900">Meetings & Attendance</h1>
                {isAdmin && (
                    <button
                        onClick={() => setShowMeetingModal(true)}
                        className="bg-slate-800 text-white px-4 py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors shadow-sm text-sm"
                    >
                        Create Meeting
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Meetings</h3>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{meetings.length}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">This Month</h3>
                    <div className="mt-2 text-3xl font-bold text-gray-900">
                        {meetings.filter(m => new Date(m.meetingDate).getMonth() === new Date().getMonth()).length}
                    </div>
                </div>
                {!isAdmin && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Your Attendance</h3>
                        <div className="mt-2 text-3xl font-bold text-green-600">{getAttendanceRate()}%</div>
                    </div>
                )}
            </div>

            {isAdmin && groupStats.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border mb-6">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Member Attendance Overview</h3>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{groupStats.length} Members</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupStats.map(stat => (
                            <div key={stat.userId} className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex flex-col transition-all hover:bg-white hover:shadow-md">
                                <span className="font-bold text-slate-800 text-sm mb-1 truncate">{stat.name}</span>
                                <div className="flex justify-between items-end mb-3">
                                    <span className={`text-2xl font-bold ${stat.percentage >= 75 ? 'text-green-600' : stat.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {stat.percentage}%
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-200 px-1.5 py-0.5 rounded">
                                        {stat.presentCount} / {stat.totalMeetings} present
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-auto">
                                    <div className={`h-1.5 rounded-full ${stat.percentage >= 75 ? 'bg-green-500' : stat.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${stat.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Meeting History</h3>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[500px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                                {isAdmin ? (
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                ) : (
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {meetings.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No meetings recorded</td></tr>
                            ) : (
                                meetings.map((meeting) => {
                                    const myAttendance = attendance.find(a => a.meeting?._id === meeting._id);
                                    return (
                                        <tr key={meeting._id}>
                                            <td className="px-6 py-4 text-sm text-gray-800">
                                                {new Date(meeting.meetingDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {meeting.title}
                                            </td>
                                            {isAdmin ? (
                                                <td className="px-6 py-4 text-sm">
                                                    <button
                                                        onClick={() => openAttendanceModal(meeting)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Mark Attendance
                                                    </button>
                                                </td>
                                            ) : (
                                                <td className="px-6 py-4 text-sm">
                                                    {myAttendance ? (
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${myAttendance.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {myAttendance.present ? 'Present' : 'Absent'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Not recorded</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Meeting</h2>
                        <form onSubmit={handleCreateMeeting} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded"
                                    value={meetingForm.title}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border rounded"
                                    value={meetingForm.meetingDate}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="e.g. Community Center"
                                    value={meetingForm.location}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowMeetingModal(false)} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mark Attendance Modal */}
            {showAttendanceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold">Attendance for {selectedMeeting?.title}</h2>
                            <p className="text-sm text-gray-500">{new Date(selectedMeeting?.meetingDate).toLocaleDateString()}</p>
                        </div>
                        <form onSubmit={handleMarkAttendance}>
                            <div className="mb-6">
                                <p className="text-sm text-gray-600 mb-2">Mark present members:</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {shgMembers.map((member) => (
                                        <label key={member._id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{member.name}</span>
                                                <span className="text-xs text-gray-400">{member.email}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-blue-600"
                                                checked={memberStatus[member._id] || false}
                                                onChange={(e) => setMemberStatus(prev => ({
                                                    ...prev,
                                                    [member._id]: e.target.checked
                                                }))}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAttendanceModal(false)} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Attendance</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Meetings;
