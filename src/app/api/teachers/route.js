import { route } from '@/server/http';
import * as teachers from '@/server/services/teachers';

export const GET = route(teachers.search);
