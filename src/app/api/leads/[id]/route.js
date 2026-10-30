import { route } from '@/server/http';
import * as leads from '@/server/services/leads';

export const GET = route(leads.detail);
