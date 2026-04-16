const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER
  },
  created_at: {
    type: DataTypes.BIGINT,
    defaultValue: () => Math.floor(Date.now() / 1000)
  },
  updated_at: {
    type: DataTypes.BIGINT,
    defaultValue: () => Math.floor(Date.now() / 1000)
  }
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: (user) => {
      const now = Math.floor(Date.now() / 1000);
      user.created_at = now;
      user.updated_at = now;
    },
    beforeUpdate: (user) => {
      user.updated_at = Math.floor(Date.now() / 1000);
    }
  }
});

module.exports = { getModel: () => User };