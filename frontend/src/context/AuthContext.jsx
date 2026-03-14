import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    const refreshUserWithSHG = useCallback(async () => {
        try {
            const { data } = await api.get('/users/profile');
            const userInfo = localStorage.getItem('userInfo');
            const parsedInfo = userInfo ? JSON.parse(userInfo) : {};

            // The profile API now returns fully populated SHG data
            const updatedUser = {
                ...data,
                token: parsedInfo.token,
                _timestamp: Date.now() // Force React to see a new object
            };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));

            console.log('[AUTH] User profile refreshed with SHG status:', !!updatedUser.shg);
            return updatedUser;
        } catch (error) {
            console.error('Failed to refresh user with SHG', error);
            return null;
        }
    }, []);

    const refreshUser = refreshUserWithSHG;

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            try {
                const userInfo = localStorage.getItem('userInfo');
                if (!userInfo) return;

                const parsedInfo = JSON.parse(userInfo);
                if (!parsedInfo?.token) {
                    localStorage.removeItem('userInfo');
                    return;
                }

                const { data } = await api.get('/users/profile');
                setUser({ ...data, token: parsedInfo.token });
            } catch (error) {
                console.warn('[AUTH] Initial check failed, attempting local fallback', error);
                const userInfoLocal = localStorage.getItem('userInfo');
                if (userInfoLocal) {
                    try {
                        const parsedInfo = JSON.parse(userInfoLocal);
                        if (parsedInfo?.token) {
                            setUser(parsedInfo);
                        } else {
                            localStorage.removeItem('userInfo');
                        }
                    } catch (e) {
                        localStorage.removeItem('userInfo');
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        checkUserLoggedIn();
    }, []);

    // Socket.io Setup
    useEffect(() => {
        if (!user?._id) return; // Only connect if user is logged in

        // Prevent multiple connections
        if (socketRef.current) return;

        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const newSocket = io(socketUrl);
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.emit('join', user._id);

        newSocket.on('memberAdded', (data) => {
            console.log('[SOCKET] Member added to SHG:', data.shgName);
            refreshUserWithSHG();
        });

        newSocket.on('transactionVerified', (data) => {
            console.log('[SOCKET] Transaction verified:', data.type);
            refreshUserWithSHG();
        });

        newSocket.on('loanStatusUpdated', (data) => {
            console.log('[SOCKET] Loan status updated:', data.status);
            refreshUserWithSHG();
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [user?._id, refreshUserWithSHG]);

    const login = async (email, password) => {
        const { data } = await api.post('/users/login', { email, password });

        // Immediately fetch fresh profile to ensure everything is populated correctly
        const { data: profileData } = await api.get('/users/profile', {
            headers: { Authorization: `Bearer ${data.token}` }
        });

        const fullUser = { ...profileData, token: data.token };
        setUser(fullUser);
        localStorage.setItem('userInfo', JSON.stringify(fullUser));
        return fullUser;
    };

    const register = async (name, email, password, role) => {
        const { data } = await api.post('/users', { name, email, password, role });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    };

    const logout = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setSocket(null);
        }
        setUser(null);
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, refreshUserWithSHG, socket }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
