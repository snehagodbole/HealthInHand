import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicKey, isSupabaseSecretKey } from "@/lib/supabaseConfig";

const protectedRoutes = [
  "/dashboard",
  "/history",
  "/progress",
  "/onboarding",
  "/together"
];
const publicRoutes = ["/login", "/signup", "/auth"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  if (isSupabaseSecretKey(supabaseKey)) {
    console.error(
      "Supabase middleware is configured with a secret key in a NEXT_PUBLIC variable. Use a publishable or anon public key instead."
    );
    return response;
  }

  // Skip auth check entirely for public routes
  const isPublic = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  if (isPublic) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Parameters<NonNullable<CookieMethodsServer["setAll"]>>[0]
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Forward any refreshed auth cookies onto the redirect response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
