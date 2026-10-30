import { route } from '@/server/http';
import * as admin from '@/server/services/admin';

export const GET = route(admin.requirements, { roles: ['admin'] });
