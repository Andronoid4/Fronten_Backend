const { sequelize } = require('../config/database');
require('./User'); // Инициализация модели

sequelize.sync({ force: false })
  .then(() => console.log('✓ Models synchronized'))
  .catch(err => console.error('✗ Sync error:', err));