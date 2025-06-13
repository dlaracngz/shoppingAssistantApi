import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "../models/userModels.js";

const images = sequelize.define(
  "productImage", // Model adı
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productImage: {
      type: DataTypes.JSON,
      defaultValue: { public_id: "", url: "" },
    },
    productMatch: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User, // User tablosuna bağlanıyor
        key: "id", // User tablosundaki id'yi referans alıyor
      },
      onDelete: "CASCADE", // Kullanıcı silinirse, fotoğrafları da sil
    },
  },
  {
    timestamps: true,
    tableName: "productImage", // Tablo adını burada belirtiyoruz
  }
);

images.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader" });

export default images;
