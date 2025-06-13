import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./userModels.js";
import marketProduct from "./productmarketModels.js";

const Cart = sequelize.define(
  "Cart",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    productMarketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "product_markets",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: true }
);

Cart.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Cart.belongsTo(marketProduct, {
  foreignKey: "productMarketId",
  onDelete: "CASCADE",
});

export default Cart;
