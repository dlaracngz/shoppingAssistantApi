import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Categories = sequelize.define(
  "Categories",
  {
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    categoryImage: {
      type: DataTypes.JSON,
      defaultValue: { public_id: "", url: "" },
    },
  },
  { timestamps: true }
);

export default Categories;
