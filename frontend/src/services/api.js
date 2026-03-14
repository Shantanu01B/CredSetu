import axios from 'axios';

const api = axios.create({
   baseURL: "https://credsetu-backend.onrender.com/api",
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const token = JSON.parse(userInfo).token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                console.error('Error parsing userInfo:', e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo && error.response.data?.message?.includes('token')) {
                localStorage.removeItem('userInfo');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
