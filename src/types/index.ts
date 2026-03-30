export type UserRole = "USER" | "ADMIN";

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface SanitizedUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  user: SanitizedUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function mapApiUserToSessionUser(user: SanitizedUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
