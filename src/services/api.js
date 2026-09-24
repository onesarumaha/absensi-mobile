import RawAsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const memoryStore = {};

const getSafeToken = async () => {
  try {
    return await RawAsyncStorage.getItem('userToken');
  } catch (e) {
    return memoryStore['userToken'] || null;
  }
};


const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

API.interceptors.request.use(
  async (config) => {
    const token = await getSafeToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await RawAsyncStorage.removeItem('userToken');
        await RawAsyncStorage.removeItem('userData');
      } catch (e) {
        console.log('Clear token error:', e.message);
      }
    }
    return Promise.reject(error);
  }
);

/* ===== Auth ===== */
export const authApi = {
  login: (email, password) => API.post('/login', { email, password }),
  me: () => API.get('/me'),
  logout: () => API.post('/logout'),
  uploadPhoto: (base64Photo) =>
    API.post('/me/photo', { photo: base64Photo }, { timeout: 30000 }),
};

/* ===== Attendance ===== */
export const attendanceApi = {
  today: () => API.get('/attendance/today'),
  history: () => API.get('/attendance/history'),
  scheduleInfo: () => API.get('/attendance/schedule-info'),
  monthlyRecap: () => API.get('/attendance/monthly-recap'),
  checkIn: (payload) =>
    API.post('/attendance/check-in', payload, { timeout: 30000 }),
  checkOut: (payload) =>
    API.post('/attendance/check-out', payload, { timeout: 30000 }),
};

/* ===== Leave Request ===== */
export const leaveApi = {
  myRequests: () => API.get('/my/leave-requests'),
  detail: (id) => API.get(`/my/leave-requests/${id}`),
  create: (payload) => API.post('/my/leave-requests', payload),
  update: (id, payload) => API.put(`/my/leave-requests/${id}`, payload),
  destroy: (id) => API.delete(`/my/leave-requests/${id}`),
};

/* ===== Banner ===== */
export const bannerApi = {
  list: () => API.get('/banners'),
};

/* ===== Work Schedule (admin) ===== */
export const workScheduleApi = {
  list: () => API.get('/work-schedules'),
  detail: (id) => API.get(`/work-schedules/${id}`),
  create: (payload) => API.post('/work-schedules', payload),
  update: (id, payload) => API.put(`/work-schedules/${id}`, payload),
  destroy: (id) => API.delete(`/work-schedules/${id}`),
};

export default API;