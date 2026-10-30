import { route } from '@/server/http';
import * as admin from '@/server/services/admin';

export const PATCH = route(admin.updateRequirement, { roles: ['admin'] });
