import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  let user = null;

  if (token) {
    user = await verifyToken(token);
  }

  // 保护需要登录的路由
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/colonies") &&
    !request.nextUrl.pathname.startsWith("/colonies/new");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
