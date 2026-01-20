import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Domains configuration
const SHARE_BASE_DOMAIN = 'evvl.io';
const MAIN_SITE = 'https://evvl.ai';

// Reserved subdomains that should NOT be treated as share IDs
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'share',
  'mail',
  'admin',
  'cdn',
  'static',
  'assets',
  'img',
  'images',
  'docs',
  'help',
  'support',
  'status',
  'blog',
]);

/**
 * Check if a string is a valid share ID format (nanoid: alphanumeric + underscore/hyphen)
 */
function isValidShareId(id: string): boolean {
  // nanoid generates 10-char IDs with [A-Za-z0-9_-]
  return /^[A-Za-z0-9_-]{10}$/.test(id);
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Redirect bare evvl.io to evvl.ai
  if (hostname === SHARE_BASE_DOMAIN || hostname === `www.${SHARE_BASE_DOMAIN}`) {
    return NextResponse.redirect(MAIN_SITE, { status: 301 });
  }

  // Check for wildcard share subdomain: {shareId}.evvl.io
  const subdomainMatch = hostname.match(/^([^.]+)\.evvl\.io$/);
  if (subdomainMatch) {
    const subdomain = subdomainMatch[1];

    // Skip reserved subdomains
    if (RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
      return NextResponse.next();
    }

    // Valid share ID subdomain - rewrite to /s/{shareId}
    if (isValidShareId(subdomain)) {
      // For root path, rewrite to the share page
      if (pathname === '/' || pathname === '') {
        const url = request.nextUrl.clone();
        url.pathname = `/s/${subdomain}`;
        return NextResponse.rewrite(url);
      }

      // Allow static assets needed for the share page
      if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/share/') ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/evvl-logo')
      ) {
        return NextResponse.next();
      }

      // Block other paths on share subdomains
      return new NextResponse('Not Found', { status: 404 });
    }

    // Invalid share ID format - 404
    return new NextResponse('Not Found', { status: 404 });
  }

  // Development: allow /s/* paths on localhost
  if (pathname.startsWith('/s/')) {
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return NextResponse.next();
    }
    // Block /s/* on production app domain (only wildcard subdomains should serve shares)
    return new NextResponse('Not Found', { status: 404 });
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
