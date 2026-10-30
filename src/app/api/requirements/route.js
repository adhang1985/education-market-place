import { route } from '@/server/http';
import * as requirements from '@/server/services/requirements';

export const POST = route(requirements.create, { roles: ['student'] });
