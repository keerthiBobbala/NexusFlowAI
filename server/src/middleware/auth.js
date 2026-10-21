const httpError = require('../utils/httpError');
const { verifyToken } = require('../utils/jwt');
const repository = require('../services/repository');

async function auth(req, res, next) {
  // TODO: Read the Bearer token, reject with 401 when it is missing or invalid, verify it,
  // TODO: load the user by decoded.sub, and set req.user and req.token.
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(httpError(401, 'Authentication required'));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next(httpError(401, 'Invalid or expired session'));
  }

  try {
    const user = decoded.sub ? await repository.getById('users', decoded.sub) : null;
    if (!user) {
      return next(httpError(401, 'Invalid or expired session'));
    }
    req.user = user;
    req.token = token;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = auth;
