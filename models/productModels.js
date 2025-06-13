import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Category from "./categoryModels.js";
import Brand from "./brandModels.js";

const Products = sequelize.define(
  "Products",
  {
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productGr: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productImage: {
      type: DataTypes.JSON,
      defaultValue: { public_id: "", url: "" },
    },
    productContents: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "brands",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  { timestamps: true }
);

Products.belongsTo(Category, { foreignKey: "categoryId", onDelete: "CASCADE" });
Products.belongsTo(Brand, { foreignKey: "brandId", onDelete: "CASCADE" });

export default Products;
