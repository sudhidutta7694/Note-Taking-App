import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        this.authToken = storedToken;
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    }

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('📡 API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('✅ API Response:', response.status, response.data);
        return response.data; // Return data directly
      },
      (error) => {
        console.error('❌ API Error:', error.response?.status, error.response?.data);
        
        // Handle 401 errors by clearing auth
        if (error.response?.status === 401) {
          this.removeAuthToken();
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ✅ Add setAuthToken method
  setAuthToken(token: string): void {
    this.authToken = token;
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Token set in ApiService:', token.substring(0, 20) + '...');
  }

  // ✅ Add removeAuthToken method
  removeAuthToken(): void {
    this.authToken = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
    console.log('🗑️ Token removed from ApiService');
  }

  // Generic request methods
  async get<T>(endpoint: string): Promise<T> {
    return await this.axiosInstance.get(endpoint);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return await this.axiosInstance.post(endpoint, data);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return await this.axiosInstance.put(endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return await this.axiosInstance.delete(endpoint);
  }

  // Auth methods
  async login(email: string, password: string): Promise<LoginResponse> {
    return await this.post<LoginResponse>('/api/auth/login', { email, password });
  }

  async register(userData: {
    email: string;
    name: string;
    dateOfBirth?: string;
  }): Promise<{ message: string; userId: string }> {
    return await this.post('/api/auth/register', userData);
  }

  async sendOTP(email: string, type: 'signup' | 'login' = 'signup'): Promise<{ message: string }> {
    return await this.post<{ message: string }>('/api/auth/send-otp', { email, type });
  }

  async verifyOTP(email: string, otp: string): Promise<LoginResponse> {
    return await this.post<LoginResponse>('/api/auth/verify-otp', { email, otp });
  }

  async resendOTP(email: string): Promise<{ message: string }> {
    return await this.post<{ message: string }>('/api/auth/resend-otp', { email });
  }

  async loginWithOTP(email: string, otp: string): Promise<LoginResponse> {
    return await this.post<LoginResponse>('/api/auth/login-otp', { email, otp });
  }

  // Profile methods
  async getProfile(): Promise<User> {
    return await this.get<User>('/api/auth/me');
  }

  // Notes methods
  async getNotes(): Promise<Note[]> {
    return await this.get<Note[]>('/api/notes');
  }

  async createNote(data: { title: string; content: string }): Promise<Note> {
    return await this.post<Note>('/api/notes', data);
  }

  async updateNote(id: string, data: { title: string; content: string }): Promise<Note> {
    return await this.put<Note>(`/api/notes/${id}`, data);
  }

  async deleteNote(id: string): Promise<void> {
    return await this.delete<void>(`/api/notes/${id}`);
  }
}

// ✅ Create and export API instance
const api = new ApiService('https://note-taking-app-f5ef.onrender.com');

export default api;
