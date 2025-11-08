export interface UserInfo {
  username: string;
  email: string;
  name?: string;
  roles: string[];
  isAdmin: boolean;
}

export interface TokenClaims {
  preferred_username?: string;
  name?: string;
  email?: string;
  sub?: string;
  realm_access?: {
    roles: string[];
  };
}

export interface AdminData {
  message: string;
  admin: string;
}

export interface ProfileData {
  message: string;
  username: string;
  authorities: Array<{ authority: string }>;
}

export interface PublicMessage {
  message: string;
}