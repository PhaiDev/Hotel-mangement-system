import { type NextRequest, type NextFetchEvent } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { logAction } from '@/lib/services/auditLog';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function shouldLogRequest(request: NextRequest, status: number) {
  const { method, nextUrl } = request;
  const pathname = nextUrl.pathname;
  const ip = getClientIp(request);

  if (MUTATION_METHODS.has(method)) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/api/norify')) return false;
  if (pathname.startsWith('/admin/login')) return true;
  if (pathname.startsWith('/admin/settings')) return true;
  if (status >= 300 && status < 400) return true;
  if (status >= 400) return true;

  return false;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { method, nextUrl } = request;
  const { response, user } = await updateSession(request);

  if (shouldLogRequest(request, response.status)) {
    const timestamp = new Date().toISOString();
    const ip = getClientIp(request);
    const pathname = nextUrl.pathname;

    console.log(
      `[${timestamp}] ${method} ${pathname} - ${response.status} - IP: ${ip}`
    );

    // Extract target ID if the path ends with an ID
    let targetId: string | null = null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1];
      if (/^\d+$/.test(last) || last.length > 10) {
        targetId = last;
      }
    }

    const details = {
      status: response.status,
      userAgent: request.headers.get('user-agent') || 'unknown',
      queryParams: Object.fromEntries(nextUrl.searchParams.entries()),
    };

    const logPromise = logAction({
      userId: user?.id || null,
      userEmail: user?.email || null,
      action: `${method} ${pathname}`,
      targetId,
      details,
      ipAddress: ip,
    });

    if (event?.waitUntil) {
      event.waitUntil(logPromise);
    } else {
      await logPromise;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
