// models/Historique.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Historique = sequelize.define('Historique', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'Historiques',
  timestamps: true,
});

module.exports = Historique;
