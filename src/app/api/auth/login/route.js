import { route } from '@/server/http';
import * as auth from '@/server/services/auth';

export const POST = route(auth.login);
