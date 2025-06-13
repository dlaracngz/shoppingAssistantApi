import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Brands = sequelize.define(
  "Brands",
  {
    brandName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    brandImage: {
      type: DataTypes.JSON,
      defaultValue: { public_id: "", url: "" },
    },
  },
  { timestamps: true }
);

export default Brands;
