
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Disable cache for Gemini/Perplexity paths to ensure valuation results are always fresh
  if (request.nextUrl.pathname.includes('/api/') || 
      request.nextUrl.pathname.includes('generativelanguage') ||
      request.nextUrl.pathname.includes('perplexity')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
