import axios from 'axios';

// 1. Create the Axios instance
const api = axios.create({
    baseURL: 'http://localhost:8080/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Add the interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. CRITICAL: Export it as the default module
export default api;