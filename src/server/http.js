import { connectDB, isConnected } from './db.js';
import { userFromRequest } from './auth.js';

// Thrown by services; becomes a JSON error response with this status (and optional machine-readable code).
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (what = 'Not found') => new HttpError(404, what);

/**
 * Wraps a service call as a Next.js Route Handler – the equivalent of the old Express middleware chain.
 *   auth: 'optional' (default) loads the user if a token is sent; 'required' returns 401 without one.
 *   roles: restricts to these user roles (implies auth: 'required').
 * The handler receives { user, query, body, params, request } and returns data (sent as JSON) or a Response.
 */
export function route(handler, { auth = 'optional', roles, status = 200 } = {}) {
  return async (request, ctx) => {
    try {
      await connectDB();
    } catch (e) {
      console.error('Database connection failed:', e.message);
      return Response.json({ message: 'Database is unavailable right now. Please try again shortly.' }, { status: 503 });
    }
    if (!isConnected()) return Response.json({ message: 'Database is unavailable right now. Please try again shortly.' }, { status: 503 });

    try {
      const user = await userFromRequest(request);
      if ((auth === 'required' || roles) && !user) throw new HttpError(401, 'Please log in to continue');
      if (roles && !roles.includes(user.role)) throw new HttpError(403, 'You do not have access to this');

      const query = Object.fromEntries(new URL(request.url).searchParams);
      const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) ? await request.json().catch(() => ({})) : undefined;
      const params = ctx?.params ? await ctx.params : {};

      const result = await handler({ user, query, body: body ?? {}, params, request });
      return result instanceof Response ? result : Response.json(result ?? { ok: true }, { status });
    } catch (err) {
      if (err instanceof HttpError) return Response.json({ message: err.message, ...(err.code && { code: err.code }) }, { status: err.status });
      if (err.name === 'ValidationError') return Response.json({ message: Object.values(err.errors)[0]?.message || 'Invalid data' }, { status: 400 });
      if (err.name === 'CastError') return Response.json({ message: 'Not found' }, { status: 404 });
      if (err.code === 11000) return Response.json({ message: 'Duplicate record' }, { status: 409 });
      console.error(err);
      return Response.json({ message: 'Something went wrong' }, { status: 500 });
    }
  };
}

// Responds with a non-default status from inside a handler.
export const withStatus = (data, status) => Response.json(data, { status });
