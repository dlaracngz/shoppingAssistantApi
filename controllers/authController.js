import bcrypt from "bcryptjs";
import userModel from "../models/userModels.js";
import cloudinary from "cloudinary";
import { getDataUri } from "../utils/features.js";
import { Op } from "sequelize";

export const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please add user name and password",
      });
    }

    const user = await userModel.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    const token = user.generateToken();

    res
      .status(200)
      .cookie("token", token, {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        secure: process.env.NODE_ENV === "development" ? true : false,
        httpOnly: process.env.NODE_ENV === "development" ? true : false,
        sameSite: process.env.NODE_ENV === "development" ? true : false,
      })
      .json({
        success: true,
        message: "Login successfully",
        token,
        user: userWithoutPassword,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error in Login API",
      error: error.message,
    });
  }
};

export const logoutController = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", "", {
        expires: new Date(Date.now()),
        secure: process.env.NODE_ENV === "production" ? true : false,
        httpOnly: process.env.NODE_ENV === "development" ? true : false,
        sameSite: process.env.NODE_ENV === "development" ? true : false,
      })
      .send({
        success: true,
        message: "Logout Successfully",
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Logout API",
      error,
    });
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

export const getUserProfileController = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).send({
      success: true,
      message: "User Profile Fetched Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Profile API",
      error,
    });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.user.id);
    const { name, surname, username, email, city, phone } = req.body;

    if (username && username !== user.username) {
      const existingUsername = await userModel.findOne({
        where: {
          username,
          id: { [Op.ne]: req.user.id }, // Kendi ID'sini hariç tut
        },
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Bu kullanıcı adı zaten kullanımda",
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await userModel.findOne({
        where: {
          email,
          id: { [Op.ne]: req.user.id }, // Kendi ID'sini hariç tut
        },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Bu e-posta adresi zaten kullanımda",
        });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (surname) user.surname = surname;
    if (city) user.city = city;
    if (phone) user.phone = phone;

    await user.save();
    res.status(200).send({
      success: true,
      message: "User Profile Update",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Profile Update",
    });
  }
};

export const updatePasswordController = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.user.id);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(500).send({
        success: false,
        message: "Please provide old or new password",
      });
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(500).send({
        success: false,
        message: "Invalid Old Password",
      });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).send({
      success: true,
      message: "Password Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Password Update",
    });
  }
};

export const updateProfilePicController = async (req, res) => {
  console.log("Middlewareden gelen request:", req.user); // Kullanıcı bilgilerini logla
  console.log("File info:", req.file); // Dosya bilgisini logla

  if (!req.user || !req.user.id) {
    return res.status(404).json({ message: "User not found" });
  }
  try {
    console.log("User ID from request:", req.user.id);

    const user = await userModel.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found in DB" });
    }

    const file = getDataUri(req.file);
    console.log("File URI:", file); // Dosyanın doğru şekilde geldiğini kontrol et

    // Önce eski profil resmini Cloudinary'den siliyoruz (eğer varsa)
    // Eğer eski resim varsa, onu silme işlemi
    // await cloudinary.v2.uploader.destroy(user.profilePic.public_id);

    // Yeni resmi Cloudinary'e yüklüyoruz
    const cdb = await cloudinary.v2.uploader.upload(file.content);
    user.profilePic = { public_id: cdb.public_id, url: cdb.secure_url };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile Picture Updated",
      profilePic: user.profilePic, // Yeni resmi döndürüyoruz
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error In Update Profile Pic API",
      error: error.message,
    });
  }
};
