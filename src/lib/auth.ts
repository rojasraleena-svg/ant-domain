import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ant-domain-secret-key-change-in-production"
);

export interface SessionUser {
  id: string;
  username: string;
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成 JWT
export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// 验证 JWT
export async function verifyToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { id: payload.id as string, username: payload.username as string };
  } catch {
    return null;
  }
}

// 从 cookie 获取当前用户（Server Component / Server Action）
export async function getSession(): Promise<SessionUser | null> {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// 设置 auth cookie
export async function setAuthCookie(token: string) {
  const { cookies } = await import("next/headers");
  (await cookies()).set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: "/",
  });
}

// 清除 auth cookie
export async function clearAuthCookie() {
  const { cookies } = await import("next/headers");
  (await cookies()).delete("auth-token");
}
