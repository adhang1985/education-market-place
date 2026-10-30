import { route } from '@/server/http';
import * as subscription from '@/server/services/subscription';

export const POST = route(subscription.subscribe, { roles: ['teacher'] });
