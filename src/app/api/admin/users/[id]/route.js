import { route } from '@/server/http';
import * as admin from '@/server/services/admin';

export const DELETE = route(admin.deleteUser, { roles: ['admin'] });
