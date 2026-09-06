export type JwtPayload = {
  sub: string;
  sessionId: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
};

export type AuthenticatedUser = {
  id: string;
  sessionId: string;
  fullName: string;
  phone: string;
  email: string | null;
  preferredLanguage: string;
  status: 'ACTIVE';
};

export type RequestContext = {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
};
