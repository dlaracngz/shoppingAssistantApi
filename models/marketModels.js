import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Admin from "./adminModels.js";

const Markets = sequelize.define(
  "Markets",
  {
    marketName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    marketLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    marketPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    marketImage: {
      type: DataTypes.JSON,
      defaultValue: { public_id: "", url: "" },
    },

    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Admin,
        key: "id",
      },
    },
  },
  { timestamps: true }
);

Markets.belongsTo(Admin, { foreignKey: "adminId", onDelete: "CASCADE" });

export default Markets;
