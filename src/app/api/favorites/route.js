import { route } from '@/server/http';
import * as catalog from '@/server/services/catalog';

export const GET = route(catalog.favorites, { auth: 'required' });
