import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ONLY scraper APIs - no broad paths
  if (request.nextUrl.pathname.match(/^\/api\/(properties|scrape|valuation)/)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'private, no-cache');
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/(properties|scrape|valuation)'
};