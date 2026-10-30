import { User } from '../models/index.js';
import { signToken } from '../auth.js';
import { HttpError, withStatus } from '../http.js';

export async function register({ body }) {
  const { name, email, password, phone, role = 'student' } = body;
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  if (!['student', 'teacher'].includes(role)) throw new HttpError(400, 'Invalid role');
  if (await User.exists({ email: email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists');

  const user = new User({ name, email, password, phone, role });
  if (role === 'teacher') {
    const { headline, categories = [], city, rate, experience } = body.teacher || {};
    user.teacher = { headline, categories, city, rate, experience, modes: ['online'], status: 'pending' };
    user.subscription = { plan: 'free', credits: 0 };
  }
  await user.save();
  return withStatus({ token: signToken(user), user: user.toSafeJSON() }, 201);
}

export async function login({ body }) {
  const { email, password } = body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password || ''))) throw new HttpError(401, 'Invalid email or password');
  return { token: signToken(user), user: user.toSafeJSON() };
}

export const me = ({ user }) => ({ user: user.toSafeJSON() });
