// models/Institute.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GOVERNORATES_TN = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Béja','Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia',
  'Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine',
  'Tataouine','Gafsa','Tozeur','Kébili',
];

const Institute = sequelize.define('Institute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  short_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  name_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  type: {
    type: DataTypes.ENUM('public', 'private', 'semi_public'),
    defaultValue: 'private',
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  governorate: {
    type: DataTypes.ENUM(...GOVERNORATES_TN),
    allowNull: true,
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  founded_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1800,
      max: new Date().getFullYear(),
    },
  },
  accreditation: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ranking: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  facebook_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  definition: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  localisation: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // FKs
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  countryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
}, {
  tableName: 'Institutes',
  timestamps: true,
  indexes: [
    { fields: ['governorate'] },
    { fields: ['type'] },
    { fields: ['countryId'] },
  ],
});

module.exports = Institute;
