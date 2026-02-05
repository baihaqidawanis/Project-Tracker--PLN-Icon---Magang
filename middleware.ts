import { auth } from "@/app/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Session-based authentication middleware
// IMPORTANT: Sessions are stored in cookies which are shared across all tabs
// in the same browser. This means when a user logs in, they will automatically
// be authenticated in new tabs - this is EXPECTED behavior, not a bug.
// Users only need to login once per browser session.
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

  if (isOnLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|image.png|uploads|favicon.ico).*)'],
}
