import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./userModels.js";
import productMarket from "./productmarketModels.js";

const Favorites = sequelize.define(
  "Favorites",
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
  },
  { timestamps: true }
);

Favorites.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Favorites.belongsTo(productMarket, {
  foreignKey: "productMarketId",
  onDelete: "CASCADE",
});

export default Favorites;
