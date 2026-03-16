
export interface PodiumUser {
  id: string;
  token: string;
}

export interface ValidatedUser {
  userId: string;
  isValid: boolean;
  userData?: any;
}

export interface JWTPayload {
  userId: string;
  email?: string;
  userData?: any;
}

export interface RefreshResponse {
  success: boolean;
  token?: string;
  error?: string;
}