import { route } from '@/server/http';
import * as teacherSelf from '@/server/services/teacherSelf';

export const GET = route(teacherSelf.reviews, { roles: ['teacher'] });
