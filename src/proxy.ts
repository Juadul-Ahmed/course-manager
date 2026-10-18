
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isStudentRoute =
    pathname === "/student" || pathname.startsWith("/student/");

  const isAdminRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!isStudentRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

      return NextResponse.redirect(loginUrl);
    }

    const role = session.user.role;

    if (role === "ADMIN" && isStudentRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (role === "STUDENT" && isAdminRoute) {
      return NextResponse.redirect(new URL("/student", request.url));
    }

    if (role !== "ADMIN" && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy authentication error:", error);

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/student/:path*", "/dashboard/:path*"],
};
