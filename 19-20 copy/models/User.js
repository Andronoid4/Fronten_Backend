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

userSchema.pre('save', function() {
  console.log('Pre-save hook called, arguments length:', arguments.length);
  console.log('First argument type:', typeof arguments[0]);
  const next = arguments[0];
  this.updated_at = Math.floor(Date.now() / 1000);
  if (typeof next === 'function') {
    next();
  } else {
    console.error('next is not a function, actual value:', next);
    // В mongoose 6+ pre('save') больше не передает next, нужно вызывать next() или использовать async/await
    // Но мы попробуем просто завершить без next, если это новый API
    // Для версии 6+ достаточно просто вернуть Promise или использовать async
    // Попробуем не вызывать next
  }
});

userSchema.pre('findOneAndUpdate', function(next) {
  console.log('Pre-findOneAndUpdate hook called');
  this.set({ updated_at: Math.floor(Date.now() / 1000) });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
