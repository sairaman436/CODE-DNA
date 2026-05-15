import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

    console.log(`MIDDLEWARE [${req.nextUrl.pathname}]:`, { role: token?.role, isAdmin });

    if (isAdminPage && !isAdmin) {
      console.warn("MIDDLEWARE: ACCESS DENIED. Redirecting to /");
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/settings/:path*"],
};
