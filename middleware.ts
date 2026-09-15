import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;

    if (!role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based route protection
    if (path.startsWith("/patient") && role !== "PATIENT" && role !== "ADMIN") {
      if (role === "DOCTOR") return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
      if (role === "FAMILY") return NextResponse.redirect(new URL("/family/dashboard", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/doctor") && role !== "DOCTOR" && role !== "ADMIN") {
      if (role === "PATIENT") return NextResponse.redirect(new URL("/patient/dashboard", req.url));
      if (role === "FAMILY") return NextResponse.redirect(new URL("/family/dashboard", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/family") && role !== "FAMILY" && role !== "ADMIN") {
      if (role === "PATIENT") return NextResponse.redirect(new URL("/patient/dashboard", req.url));
      if (role === "DOCTOR") return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/family/:path*",
    "/admin/:path*",
  ],
};
