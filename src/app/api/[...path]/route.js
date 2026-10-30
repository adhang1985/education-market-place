// Unknown /api/* paths answer with JSON (not the HTML 404 page) so the client shows a clean error.
const notFound = () => Response.json({ message: 'Not found' }, { status: 404 });
export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE };
