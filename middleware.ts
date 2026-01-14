import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Domains configuration
const SHARE_DOMAIN = 'share.evvl.io';
const REDIRECT_DOMAIN = 'evvl.io';
const MAIN_SITE = 'https://evvl.ai';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Redirect evvl.io root domain to evvl.ai
  if (hostname === REDIRECT_DOMAIN || hostname === `www.${REDIRECT_DOMAIN}`) {
    return NextResponse.redirect(MAIN_SITE, { status: 301 });
  }

  // Share routes (/s/*) should ONLY work on share.evvl.io
  if (pathname.startsWith('/s/')) {
    // Allow on share domain
    if (hostname === SHARE_DOMAIN) {
      return NextResponse.next();
    }

    // Allow in development
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return NextResponse.next();
    }

    // Block on all other domains - return 404
    return new NextResponse('Not Found', { status: 404 });
  }

  // Block non-share routes on share.evvl.io (only /s/* should work there)
  if (hostname === SHARE_DOMAIN && !pathname.startsWith('/s/')) {
    // Allow static assets and API routes needed for shares
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/share/') ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/evvl-logo')
    ) {
      return NextResponse.next();
    }

    // Redirect everything else to main site
    return NextResponse.redirect(MAIN_SITE, { status: 302 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Static files with extensions
     */
    '/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2)$).*)',
  ],
};
