import { route } from '@/server/http';
import * as subscription from '@/server/services/subscription';

export const GET = route(subscription.plan);
