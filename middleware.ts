import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const protectedRoutes = ["/chat", "/explore", "/map", "/community", "/admin"]
  const isProtected = protectedRoutes.some((r) => req.nextUrl.pathname.startsWith(r))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/auth", req.url))
  }

  // If already logged in and hitting /auth or /landing, redirect to /chat
  if (session && (req.nextUrl.pathname === "/auth" || req.nextUrl.pathname === "/landing")) {
    return NextResponse.redirect(new URL("/chat", req.url))
  }

  return res
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/explore/:path*",
    "/map/:path*",
    "/community/:path*",
    "/admin/:path*",
    "/auth",
    "/landing",
  ],
}
