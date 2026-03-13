import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PATHS = ["/chat", "/explore", "/map", "/community", "/admin"]

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

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
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (isProtected(req.nextUrl.pathname) && !session) {
    return NextResponse.redirect(new URL("/auth", req.url))
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
  ],
}
