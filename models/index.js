import { Sequelize } from "sequelize";
import sequelize from "../config/database.js"; // Veritabanı bağlantın
import Product from "./productModels.js";
import Market from "./marketModels.js";
import ProductMarket from "./product_marketModels.js";

// İlişkileri tanımla
Product.belongsToMany(Market, {
  through: ProductMarket,
  foreignKey: "productId",
});
Market.belongsToMany(Product, {
  through: ProductMarket,
  foreignKey: "marketId",
});

ProductMarket.belongsTo(Product, { foreignKey: "productId" });
ProductMarket.belongsTo(Market, { foreignKey: "marketId" });

Market.hasMany(ProductMarket, { foreignKey: "marketId" });
Product.hasMany(ProductMarket, { foreignKey: "productId" });

export { sequelize, Product, Market, ProductMarket };
