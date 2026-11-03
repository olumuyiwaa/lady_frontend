import { authFetch } from "./authFetch";

export type CurrentUserProfile = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  globalRole?: string;
  businessId?: string | null;
  businessRole?: string | null;
  business?: {
    id: string;
    name: string;
    subdomain: string;
    timezone: string;
  } | null;
};

export async function getMe(): Promise<CurrentUserProfile> {
  const result = await authFetch(`/auth/me`, { method: "GET" });
  return result.data as CurrentUserProfile;
}

export async function updateMe(payload: {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}): Promise<CurrentUserProfile> {
  const result = await authFetch(`/auth/me`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return result.data as CurrentUserProfile;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await authFetch(`/auth/me/password`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function generate2FA(): Promise<{ otpauth_url?: string; base32?: string }> {
  const result = await authFetch(`/auth/2fa/generate`, { method: "POST" });
  return result.data as { otpauth_url?: string; base32?: string };
}

export async function verifyEnable2FA(token: string): Promise<void> {
  await authFetch(`/auth/2fa/verify-enable`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function disable2FA(confirmation: { password: string; code: string }): Promise<void> {
  await authFetch(`/auth/2fa/disable`, {
    method: "POST",
    body: JSON.stringify({ password: confirmation.password, code: confirmation.code }),
  });
}
