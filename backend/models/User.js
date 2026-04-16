// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('candidate', 'institute', 'admin'),
    defaultValue: 'candidate',
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^\+[0-9]{7,15}$/,
    },
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sex: {
    type: DataTypes.ENUM('Homme', 'Femme'),
    allowNull: true,
  },
  diploma: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  profileCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  diplomaFileUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // Clés étrangères déclarées ici pour référence ; les associations les ajoutent
  instituteId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  countryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'Users',
  timestamps: true,
  indexes: [{ fields: ['role'] }],
});

module.exports = User;
