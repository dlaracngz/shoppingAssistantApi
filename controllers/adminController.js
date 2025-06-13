import bcrypt from "bcryptjs";
import adminModel from "../models/adminModels.js";
import { Sequelize } from "sequelize";
import cloudinary from "cloudinary";
import { getDataUri } from "../utils/features.js";
import marketModel from "../models/marketModels.js";
import { Op } from "sequelize";
import { sequelize } from "../config/db.js";

export const registerController = async (req, res) => {
  try {
    const {
      name,
      surname,
      username,
      email,
      password,
      city,
      phoneNumber,
      adminRole,
    } = req.body;

    const profilePic = req.file; // Yüklenen dosya

    if (
      !name ||
      !surname ||
      !username ||
      !email ||
      !password ||
      !city ||
      !phoneNumber ||
      !adminRole
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all fields",
      });
    }

    // Dosya varsa Cloudinary'e yükle
    let profilePicUrl = { public_id: "", url: "" };
    if (profilePic) {
      const fileUri = getDataUri(profilePic);
      const cdb = await cloudinary.v2.uploader.upload(fileUri.content);
      profilePicUrl = {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      };
    }

    // Yeni kullanıcı oluştur
    const admin = await adminModel.create({
      name,
      surname,
      username,
      email,
      password, // Model içindeki `beforeCreate` hook'u burada şifreyi hashleyecek
      city,
      phoneNumber,
      adminRole,
      profilePic: profilePicUrl, // Yüklenen fotoğraf burada kaydedilir
    });

    // Kullanıcı nesnesini JSON olarak alıp şifreyi gizle
    const adminWithoutPassword = admin.toJSON();
    delete adminWithoutPassword.password;

    res.status(201).json({
      success: true,
      message: "Registration successful, please login",
      admin: adminWithoutPassword, // Şifresi gizlenmiş kullanıcı döndürülüyor
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Sequelize.UniqueConstraintError) {
      return res.status(400).json({
        success: false,
        message: "Admin name or email already taken",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error in Register API",
      error: error.message,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("Eksik bilgi: Kullanıcı adı veya şifre eksik");
      return res.status(400).json({
        success: false,
      });
    }

    const admin = await adminModel.findOne({ where: { username } });

    if (!admin) {
      console.log("Admin bulunamadı: " + username);
      return res.status(404).json({
        success: false,
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      console.log("Geçersiz giriş: Yanlış şifre");
      return res.status(400).json({
        success: false,
      });
    }

    const adminWithoutPassword = admin.toJSON();
    delete adminWithoutPassword.password;

    console.log("Admin login:", admin);

    const token = admin.generateToken();

    console.log("Başarıyla giriş yapıldı: " + username);

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
        token,
        admin: adminWithoutPassword,
      });
  } catch (error) {
    console.log("Giriş hatası:", error.message);
    res.status(500).json({
      success: false,
    });
  }
};

export const logoutController = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", "", {
        expires: new Date(Date.now()),
        secure: process.env.NODE_ENV === "development" ? true : false,
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

export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await adminModel.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: "User not foundc" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ eroor: error.message });
  }
};

export const getAdminProfileController = async (req, res) => {
  try {
    const admin = await adminModel.findByPk(req.admin.id, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).send({
      success: true,
      message: "Admin Profile Fetched Successfully",
      admin,
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
    const admin = await adminModel.findByPk(req.admin.id);
    const { name, surname, username, email, city, phoneNumber, adminRole } =
      req.body;

    // Eski resmi silme ve yeni resmi yükleme
    if (req.file) {
      if (admin.profilePic?.public_id) {
        await cloudinary.v2.uploader.destroy(admin.profilePic.public_id);
      }

      const fileUri = getDataUri(req.file);
      const uploaded = await cloudinary.v2.uploader.upload(fileUri.content);

      admin.profilePic = {
        public_id: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    // Kullanıcı adı kontrolü
    if (username && username !== admin.username) {
      const existingAdminname = await adminModel.findOne({
        where: {
          username,
          id: { [Op.ne]: req.admin.id },
        },
      });
      if (existingAdminname) {
        return res.status(400).json({
          success: false,
          message: "Bu kullanıcı adı zaten kullanımda",
        });
      }
      admin.username = username;
    }

    // E-posta kontrolü
    if (email && email !== admin.email) {
      const existingAdminEmail = await adminModel.findOne({
        where: {
          email,
          id: { [Op.ne]: req.admin.id },
        },
      });
      if (existingAdminEmail) {
        return res.status(400).json({
          success: false,
          message: "Bu e-posta adresi zaten kullanımda",
        });
      }
      admin.email = email;
    }

    if (name) admin.name = name;
    if (surname) admin.surname = surname;
    if (city) admin.city = city;
    if (phoneNumber) admin.phoneNumber = phoneNumber;
    if (adminRole) admin.adminRole = adminRole;

    await admin.save();

    console.log("Gelen BODY:", req.body);
    console.log("Gelen FILE:", req.file);

    res.status(200).send({
      success: true,
      message: "Admin profili güncellendi",
      admin,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Profil güncelleme hatası",
    });
  }
};

export const updatePasswordController = async (req, res) => {
  try {
    const admin = await adminModel.findByPk(req.admin.id);

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).send({
        success: false,
        message: "Please provide old and new password",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).send({
        success: false,
        message: "Invalid Old Password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await admin.save();

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

export const updateAdmin = async (req, res) => {
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
      adminRole,
    } = req.body;

    const admin = await adminModel.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // Eski resmi silme ve yeni resmi yükleme
    if (req.file) {
      if (admin.profilePic?.public_id) {
        await cloudinary.v2.uploader.destroy(admin.profilePic.public_id);
      }

      const fileUri = getDataUri(req.file);
      const uploaded = await cloudinary.v2.uploader.upload(fileUri.content);

      admin.profilePic = {
        public_id: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    // Sadece yeni şifre geldiyse hashle
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
    }

    // Diğer alanları güncelle
    admin.name = name;
    admin.surname = surname;
    admin.username = username;
    admin.email = email;
    admin.city = city;
    admin.phoneNumber = phoneNumber;
    admin.adminRole = adminRole;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAdmin = async (req, res) => {
  const transaction = await sequelize.transaction(); // Transaction başlatıyoruz

  try {
    const { id } = req.params;

    // Admini buluyoruz
    const admin = await adminModel.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Adminin sahip olduğu marketi buluyoruz
    const market = await marketModel.findOne({ where: { adminId: id } });
    if (market) {
      // Market varsa, önce ürün-market ilişkilerini siliyoruz
      await productMarketModel.destroy({
        where: { marketId: market.id },
        transaction,
      });

      // Sonra marketi siliyoruz
      await market.destroy({ transaction });
    }

    // Admini siliyoruz
    await admin.destroy({ transaction });

    // Transaction'ı commit ediyoruz
    await transaction.commit();

    res.status(200).json({
      message: "Admin and associated market and products deleted successfully",
    });
  } catch (error) {
    await transaction.rollback(); // Hata durumunda transaction'ı geri alıyoruz
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await adminModel.findAll({
      attributes: { exclude: ["password"] }, // ✅ Şifreyi göstermiyoruz
    });
    res.status(200).json(admins);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Sunucu hatası" });
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

export const updateProfilePicController = async (req, res) => {
  console.log("Middlewareden geçen request:", req.admin);
  if (!req.admin || !req.admin.id) {
    return res.status(404).json({ message: "User not found" });
  }
  try {
    console.log("Admin ID from request:", req.admin?.id);

    const admin = await adminModel.findByPk(req.admin.id);

    const file = getDataUri(req.file);

    const cdb = await cloudinary.v2.uploader.upload(file.content);

    // Kullanıcının profilePic alanını güncelliyoruz
    admin.profilePic = { public_id: cdb.public_id, url: cdb.secure_url };

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Profile Picture Updated",
      profilePic: admin.profilePic, // Yeni resmi döndürüyoruz
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
