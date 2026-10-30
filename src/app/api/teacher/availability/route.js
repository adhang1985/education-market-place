import { route } from '@/server/http';
import * as teacherSelf from '@/server/services/teacherSelf';

export const PUT = route(teacherSelf.setAvailability, { roles: ['teacher'] });
