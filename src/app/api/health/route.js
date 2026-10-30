import { connectDB, isConnected } from '@/server/db';

export async function GET() {
  await connectDB().catch(() => {});
  return Response.json({ ok: true, db: isConnected() ? 'connected' : 'disconnected' });
}
