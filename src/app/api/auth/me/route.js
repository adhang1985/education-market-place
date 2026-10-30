import { route } from '@/server/http';
import * as auth from '@/server/services/auth';

export const GET = route(auth.me, { auth: 'required' });
