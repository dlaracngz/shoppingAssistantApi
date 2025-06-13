import { Sequelize } from "sequelize";
import colors from "colors";
import dotenv from "dotenv";

dotenv.config(); // .env dosyasını yükle

// Sequelize bağlantısını oluştur
const sequelize = new Sequelize(process.env.MYSQL_URL, {
  dialect: "mysql",
  logging: false, // Konsolda SQL sorgularını görmek istemiyorsan false yap
});

// Bağlantıyı test eden fonksiyon
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Connected: ${sequelize.config.host}`.bgGreen.white);
  } catch (error) {
    console.log(`MySQL Error: ${error.message}`.bgRed.white);
  }
};

export { sequelize, connectDB };
export default connectDB;
