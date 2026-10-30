import { route } from '@/server/http';
import * as teachers from '@/server/services/teachers';

export const POST = route(teachers.recordView);
