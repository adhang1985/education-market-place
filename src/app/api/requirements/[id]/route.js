import { route } from '@/server/http';
import * as requirements from '@/server/services/requirements';

export const PATCH = route(requirements.update, { roles: ['student'] });
