// models/Program.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Program = sequelize.define('Program', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING(100),
    defaultValue: 'Licence',
  },
  level: {
    type: DataTypes.ENUM(
      'Licence','Licence Appliquée','Master','Master de Recherche',
      'Mastère Professionnel','Ingénieur','Préparatoire','BTS'
    ),
    defaultValue: 'Licence',
  },
  field_of_study: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  duration_years: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    validate: {
      min: 0.1,
      max: 8,
    },
  },
  language: {
    type: DataTypes.ENUM('Français', 'Anglais', 'Arabe', 'Bilingue'),
    defaultValue: 'Français',
  },
  tuition_fee_tnd: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: { min: 0 },
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1 },
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  credits_ects: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  accreditation_valid_until: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  accreditation_status: {
    type: DataTypes.ENUM('accredited', 'in_progress', 'expired', 'suspended'),
    defaultValue: 'accredited',
  },
  // FK
  instituteId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'Programs',
  timestamps: true,
  indexes: [
    { fields: ['level'] },
    { fields: ['field_of_study'] },
    { fields: ['instituteId'] },
    { fields: ['accreditation_status'] },
  ],
});

module.exports = Program;
