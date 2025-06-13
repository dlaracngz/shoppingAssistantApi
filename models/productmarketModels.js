import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Product from "./productModels.js";
import Market from "./marketModels.js";

const product_Market = sequelize.define(
  "product_Market",
  {
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    marketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "markets",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    regularPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    discountPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    discountRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    stockAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  { timestamps: true, tableName: "product_markets" }
);

product_Market.belongsTo(Product, {
  foreignKey: "productId",
  onDelete: "CASCADE",
});
product_Market.belongsTo(Market, {
  foreignKey: "marketId",
  onDelete: "CASCADE",
});

export default product_Market;
