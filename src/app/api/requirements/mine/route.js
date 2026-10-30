import { route } from '@/server/http';
import * as requirements from '@/server/services/requirements';

export const GET = route(requirements.mine, { roles: ['student'] });
