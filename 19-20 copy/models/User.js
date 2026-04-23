const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'first_name обязателен'],
    maxlength: 100
  },
  last_name: {
    type: String,
    required: [true, 'last_name обязателен'],
    maxlength: 100
  },
  age: {
    type: Number,
    min: 0
  },
  created_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  updated_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }
}, {
  versionKey: false,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  }
});

// Для save – используем обычную функцию (next есть)
userSchema.pre('save', function(next) {
  this.updated_at = Math.floor(Date.now() / 1000);
  next();
});

// Для findOneAndUpdate – используем асинхронную функцию (next не нужен)
userSchema.pre('findOneAndUpdate', async function() {
  this.set({ updated_at: Math.floor(Date.now() / 1000) });
});

const User = mongoose.model('User', userSchema);
module.exports = User;