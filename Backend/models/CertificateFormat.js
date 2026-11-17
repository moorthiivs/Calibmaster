// models/CertificateFormat.js
module.exports = (sequelize, DataTypes) => {
  const CertificateFormat = sequelize.define(
    "CertificateFormat",
    {
      lab_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      format_template: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      required_fields: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      preview: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      format_no: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      running_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      running_no_month: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: "00",
      },
      running_no_year: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: "00",
      },
    },
    {
      tableName: "certificate_formats",
      underscored: true,
      timestamps: true,
    }
  );

  return CertificateFormat;
};
