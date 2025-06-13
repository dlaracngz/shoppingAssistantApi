import bcrypt from "bcryptjs";
import userModel from "../models/userModels.js";
import { Sequelize } from "sequelize";
import favoriteModel from "../models/favoriteModels.js";
import cartModel from "../models/cartModels.js";
import { sequelize } from "../config/db.js";

export const registerController = async (req, res) => {
  try {
    const { name, surname, username, email, password, city, phoneNumber } =
      req.body;

    if (
      !name ||
      !surname ||
      !username ||
      !email ||
      !password ||
      !city ||
      !phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all fields",
      });
    }

    // Yeni kullanıcı oluştur
    const user = await userModel.create({
      name,
      surname,
      username,
      email,
      password, // Model içindeki `beforeCreate` hook'u burada şifreyi hashleyecek
      city,
      phoneNumber,
    });

    // Kullanıcı nesnesini JSON olarak alıp şifreyi gizle
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      message: "Registration successful, please login",
      user: userWithoutPassword, // ✅ Şifresi gizlenmiş kullanıcı döndürülüyor
    });
  } catch (error) {
    console.error(error);

    // Eğer hata unique constraint ise özel mesaj döndür
    if (error instanceof Sequelize.UniqueConstraintError) {
      return res.status(400).json({
        success: false,
        message: "User name or email already taken",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error in Register API",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      surname,
      username,
      email,
      password,
      city,
      phoneNumber,
      profilePic,
    } = req.body;

    const user = await userModel.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updatedPassword = user.password;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    await user.update({
      name,
      surname,
      username,
      email,
      password: updatedPassword,
      city,
      phoneNumber,
      profilePic,
    });

    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ eroor: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction(); // Transaction başlatıyoruz

  try {
    const { id } = req.params;

    // Kullanıcıyı buluyoruz
    const user = await userModel.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kullanıcının favorilerini siliyoruz
    await favoriteModel.destroy({
      where: { userId: id },
      transaction, // Transaction içinde işlem yapıyoruz
    });

    // Kullanıcının sepetini siliyoruz
    await cartModel.destroy({
      where: { userId: id },
      transaction, // Transaction içinde işlem yapıyoruz
    });

    // Son olarak kullanıcıyı siliyoruz
    await user.destroy({ transaction });

    // Transaction'ı commit ediyoruz
    await transaction.commit();

    res.status(200).json({
      message:
        "User and associated favorites and cart items deleted successfully",
    });
  } catch (error) {
    await transaction.rollback(); // Hata durumunda transaction'ı geri alıyoruz
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await userModel.findAll({
      attributes: { exclude: ["password"] }, // ✅ Şifreyi göstermiyoruz
    });
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
