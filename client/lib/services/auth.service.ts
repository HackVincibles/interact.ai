import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000/api';

const authService = axios.create({
  baseURL: `${API_URL}/auth`,
  withCredentials: true,
});

export const registerUser = async (userData: any) => {
  const response = await authService.post('/register', userData);
  return response.data;
};

export const loginUser = async (userData: any) => {
  const response = await authService.post('/login', userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await authService.get('/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await authService.get('/me');
  return response.data;
};

export default authService;
