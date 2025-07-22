const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'user' | 'admin' | 'mentor' | 'business';
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  isActive: boolean;
  lastLogin: string | null;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: {
    user: User;
    redirectUrl: string;
  };
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      this.token = data.token;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token and user data
      this.token = data.token;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user');
      }

      return data.data.user;
    } catch (error) {
      console.error('Get user error:', error);
      this.logout();
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export default new AuthService();
