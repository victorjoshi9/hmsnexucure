const BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/v1` 
  : 'http://localhost:3000/api/v1';

export interface EmployeeProfile {
  id: string;
  name: string;
  role: 'staff' | 'dept_head' | 'hr' | 'super_admin';
  dept?: string;
  shift?: string;
  photo_url?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  employee: EmployeeProfile;
  requires_face_enrollment?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private getStored(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }

  private setStored(key: string, value: string | null) {
    if (typeof window === 'undefined') return;
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }

  get accessToken(): string | null {
    return this.getStored('access_token');
  }

  set accessToken(val: string | null) {
    this.setStored('access_token', val);
  }

  get refreshToken(): string | null {
    return this.getStored('refresh_token');
  }

  set refreshToken(val: string | null) {
    this.setStored('refresh_token', val);
  }

  get user(): EmployeeProfile | null {
    const raw = this.getStored('user_profile');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  set user(val: EmployeeProfile | null) {
    this.setStored('user_profile', val ? JSON.stringify(val) : null);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.map(cb => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || errorData?.message || 'Login failed');
    }

    const data: AuthResponse = await res.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.user = data.employee;
    return data;
  }

  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      }
    } catch (e) {
      console.warn('Logout endpoint failed:', e);
    } finally {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  private async tryRefreshToken(): Promise<string> {
    const rToken = this.refreshToken;
    if (!rToken) {
      throw new Error('No refresh token available');
    }

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: rToken }),
    });

    if (!res.ok) {
      throw new Error('Refresh token invalid');
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }
    return data.access_token;
  }

  async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    
    // Set headers
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    options.headers = headers;

    let response = await fetch(url, options);

    if (response.status === 401) {
      // If unauthorized, check if we're already refreshing
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const newToken = await this.tryRefreshToken();
          this.isRefreshing = false;
          this.onRefreshed(newToken);
        } catch (err) {
          this.isRefreshing = false;
          this.accessToken = null;
          this.refreshToken = null;
          this.user = null;
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw err;
        }
      }

      // Queue the request until token is refreshed
      const retryRequest = new Promise((resolve, reject) => {
        this.addRefreshSubscriber((newToken: string) => {
          const newHeaders = new Headers(options.headers);
          newHeaders.set('Authorization', `Bearer ${newToken}`);
          options.headers = newHeaders;
          fetch(url, options)
            .then(res => {
              if (!res.ok) {
                res.json().then(reject).catch(() => reject(new Error('Retry failed')));
              } else {
                resolve(res.json());
              }
            })
            .catch(reject);
        });
      });

      return retryRequest;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || errorData?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return response.json().catch(() => ({}));
  }

  async get(path: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<any> {
    let query = '';
    if (params) {
      const cleanParams: Record<string, string> = {};
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = String(val);
        }
      });
      if (Object.keys(cleanParams).length > 0) {
        query = '?' + new URLSearchParams(cleanParams).toString();
      }
    }
    return this.request(`${path}${query}`, { method: 'GET' });
  }

  async post(path: string, body?: any): Promise<any> {
    const isFormData = body instanceof FormData;
    return this.request(path, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  async put(path: string, body?: any): Promise<any> {
    const isFormData = body instanceof FormData;
    return this.request(path, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  async patch(path: string, body?: any): Promise<any> {
    const isFormData = body instanceof FormData;
    return this.request(path, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  async del(path: string): Promise<any> {
    return this.request(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
