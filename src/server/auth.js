import jwt from 'jsonwebtoken';
import { User } from './models/index.js';

const SECRET = () => process.env.JWT_SECRET || 'tutorhub-dev-secret';

export const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, SECRET(), { expiresIn: '7d' });

// Resolves the Bearer token to a User document; invalid/expired tokens are treated as anonymous.
export async function userFromRequest(request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(header.slice(7), SECRET());
    return await User.findById(id);
  } catch {
    return null;
  }
}
