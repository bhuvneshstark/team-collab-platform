import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: 'https://team-collab-api-hvrn.onrender.com/api',
});

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;