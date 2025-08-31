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
    },
    {
      tableName: "certificate_formats",
      underscored: true,
      timestamps: true,
    }
  );

  return CertificateFormat;
};
