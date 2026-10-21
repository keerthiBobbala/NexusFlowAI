const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const repository = require('../services/repository');
const { signToken } = require('../utils/jwt');

function sanitizeUser(user) {
  if (!user) return null;
  const { password, _id, __v, ...safeUser } = user;
  return safeUser;
}

const register = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!name || !email || !password) {
    throw httpError(400, 'Name, email, and password are required');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'Enter a valid email address');
  }
  if (password.length < 6) {
    throw httpError(400, 'Password must be at least 6 characters');
  }
  if (await repository.getOne('users', { email })) {
    throw httpError(409, 'An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await repository.create('users', { name, email, password: hashedPassword });
  } catch (error) {
    if (error.code === 11000) {
      throw httpError(409, 'An account with this email already exists');
    }
    throw error;
  }
  res.status(201).json({ user: sanitizeUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    throw httpError(400, 'Email and password are required');
  }
  const user = await repository.getOne('users', { email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw httpError(401, 'Invalid email or password');
  }
  const safeUser = sanitizeUser(user);
  const token = signToken({ sub: user.id });
  res.json({ user: safeUser, token });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = {
  register,
  login,
  me,
  sanitizeUser
};
