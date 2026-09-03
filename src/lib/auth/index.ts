import { NextRequest, NextResponse } from "next/server";

export type UserRole = "admin" | "user";

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Auth middleware stub — replace with real auth (NextAuth, Clerk, etc.)
 *
 * For now, reads role from X-User-Role header or defaults to admin in dev.
 * In production, integrate with your auth provider.
 */
export function getAuthContext(request: NextRequest): AuthContext {
  const role = (request.headers.get("X-User-Role") as UserRole) ?? "admin";
  const email = request.headers.get("X-User-Email") ?? "admin@tga.com";
  const userId = request.headers.get("X-User-Id") ?? "admin-1";

  return { userId, email, role };
}

export function requireAdmin(auth: AuthContext): NextResponse | null {
  if (auth.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: admin access required" },
      { status: 403 }
    );
  }
  return null;
}

export function requireAuth(auth: AuthContext): NextResponse | null {
  if (!auth.userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
}
