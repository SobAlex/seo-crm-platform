export interface AuthPayload {
  sub: string;
  email: string;
  companyId: string;
  role: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  phone: string | null;
  telegram: string | null;
  avatar: string | null;
  companyName: string;
  companyInn: string | null;
  companyCity: string | null;
  companyAddress: string | null;
  companyEmail: string | null;
}

export interface AuthSession {
  accessToken: string;
  user: PublicUser;
}
