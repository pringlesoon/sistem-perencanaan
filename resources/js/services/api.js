import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

export default api;
