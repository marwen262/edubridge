// models/Country.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Country = sequelize.define('Country', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(10), // ex: +216
    allowNull: true,
  },
  phoneLength: {
    type: DataTypes.INTEGER,
    defaultValue: 8,
  },
}, {
  tableName: 'Countries',
  timestamps: true,
});

module.exports = Country;
