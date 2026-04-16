const User = require('../models/User');

const formatResponse = (user) => {
  if (!user) return null;
  const data = user.toObject ? user.toObject() : user;
  return {
    id: data.id || data._id?.toString(),
    first_name: data.first_name,
    last_name: data.last_name,
    age: data.age,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'first_name и last_name обязательны' });
    }
    const user = new User({ first_name, last_name, age });
    await user.save();
    res.status(201).json(formatResponse(user));
  } catch (error) {
    console.error('Create error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.json(users.map(formatResponse));
  } catch (error) {
    console.error('ReadAll error:', error);
    res.status(500).json({ error: 'Ошибка получения списка' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(formatResponse(user));
  } catch (error) {
    console.error('ReadOne error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, age } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { first_name, last_name, age },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(formatResponse(user));
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ message: 'Пользователь удалён', id });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
};