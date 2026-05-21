import { getCurrentUser } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await getCurrentUser(req);
  if (!user) return res.status(200).json({ user: null });
  return res.status(200).json({ user });
}
