import { route } from '@/server/http';
import * as leads from '@/server/services/leads';

export const POST = route(leads.report, { roles: ['teacher'] });
