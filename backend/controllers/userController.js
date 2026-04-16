// controllers/userController.js
const { User } = require('../models');

// GET /api/users  (admin)
exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    return res.status(200).json({ users });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/users/:id
exports.getOne = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// PUT /api/users/:id
exports.update = async (req, res) => {
  try {
    // Un candidat ne peut modifier que son propre profil ; un admin peut tout modifier
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const { firstName, lastName, phone, city, sex, diploma } = req.body;

    // Upload diplôme via multer (champ diplomaFile)
    const diplomaFileUrl = req.file ? `uploads/${req.file.filename}` : user.diplomaFileUrl;

    await user.update({ firstName, lastName, phone, city, sex, diploma, diplomaFileUrl });

    const updated = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    return res.status(200).json({ message: 'Profil mis à jour.', user: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// DELETE /api/users/:id  (admin)
exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    await user.destroy();
    return res.status(200).json({ message: 'Utilisateur supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
