import { route } from '@/server/http';
import * as teacherSelf from '@/server/services/teacherSelf';

export const GET = route(teacherSelf.unlocks, { roles: ['teacher'] });
