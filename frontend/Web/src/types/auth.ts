export type AuthUser = {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  preferredLanguage: 'en' | 'bn';
  status: 'ACTIVE';
};

export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: number };
export type AuthSession = AuthTokens & { user: AuthUser };
export type OnboardingProgress = {
  accountVerified: boolean;
  emailProvided: boolean;
  professionalVerification: string | null;
  chambersJoined: number;
  complete: boolean;
};
