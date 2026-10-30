import { route } from '@/server/http';
import * as admin from '@/server/services/admin';

export const POST = route(admin.resolveReport, { roles: ['admin'] });
