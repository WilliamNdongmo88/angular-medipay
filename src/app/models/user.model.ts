export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_CLIENT' | 'ROLE_PHARMACIST';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}
