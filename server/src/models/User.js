const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

// TODO: Define the fields: id, name, email (unique), password.
// TODO: Keep `id` as an indexed, unique randomUUID default.
const UserSchema = new mongoose.Schema(
  {
    id: { type: String, default: randomUUID, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
