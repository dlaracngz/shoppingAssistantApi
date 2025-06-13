import JWT from "jsonwebtoken";
import User from "../models/userModels.js";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";

// Kullanıcı kayıt/güncelleme validasyonu
export const validateUser = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("İsim alanı zorunludur")
    .isLength({ min: 2, max: 50 })
    .withMessage("İsim en az 2, en fazla 50 karakter olmalıdır"),

  body("surname")
    .trim()
    .notEmpty()
    .withMessage("Soyisim alanı zorunludur")
    .isLength({ min: 2, max: 50 })
    .withMessage("Soyisim en az 2, en fazla 50 karakter olmalıdır"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Kullanıcı adı alanı zorunludur")
    .isLength({ min: 3, max: 30 })
    .withMessage("Kullanıcı adı en az 3, en fazla 30 karakter olmalıdır")
    .custom(async (value, { req }) => {
      // Sequelize ile database sorgusu
      const existingUser = await User.findOne({
        where: {
          username: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingUser && existingUser.id !== req.body.id) {
        throw new Error("Kullanıcı adı zaten kullanımda");
      }
    }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("E-posta adresi alanı zorunludur")
    .isEmail()
    .withMessage("Geçerli bir e-posta adresi girin")
    .custom(async (value, { req }) => {
      // Sequelize ile database sorgusu
      const existingUser = await User.findOne({
        where: {
          email: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingUser && existingUser.id !== req.body.id) {
        throw new Error("E-posta adresi zaten kullanımda");
      }
    }),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Şifre alanı zorunludur")
    .isLength({ min: 8 })
    .withMessage("Şifre en az 8 karakter olmalıdır")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&.])[A-Za-z\d@$!%?&.]{8,}$/
    )
    .withMessage(
      "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir."
    ),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Telefon numarası zorunludur")
    .matches(/^(\+?\d{1,4}[-.\s]?)?\d{10}$/)
    .withMessage("Geçerli bir telefon numarası girin"),

  body("profilPic")
    .optional()
    .isURL()
    .withMessage("Geçerli bir profil fotoğrafı URL'si girin"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("Şehir alanı zorunludur")
    .isLength({ min: 3, max: 50 })
    .withMessage("Şehir adı en az 3, en fazla 50 karakter olmalıdır"),

  // Hata kontrolü
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePic = [
  body("profilePic")
    .optional()
    .custom((value, { req }) => {
      const file = req.file; // dosya yüklendi mi?
      if (
        file &&
        !["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)
      ) {
        throw new Error(
          "Yalnızca JPEG, PNG veya JPG dosya formatı kabul edilir"
        );
      }
      // Maksimum dosya boyutunu kontrol et (örneğin 5MB)
      if (file && file.size > 5 * 1024 * 1024) {
        throw new Error("Dosya boyutu 5MB'i geçemez");
      }
      return true;
    }),
];

export const validateUpdateUser = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("İsim alanı zorunludur")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("İsim en az 2, en fazla 50 karakter olmalıdır"),

  body("surname")
    .trim()
    .notEmpty()
    .withMessage("Soyisim alanı zorunludur")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Soyisim en az 2, en fazla 50 karakter olmalıdır"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Kullanıcı adı alanı zorunludur")
    .isLength({ min: 3, max: 30 })
    .withMessage("Kullanıcı adı en az 3, en fazla 30 karakter olmalıdır")
    .custom(async (value, { req }) => {
      const id = req.params.id || req.body.id;

      const currentUser = await User.findByPk(id);
      if (!currentUser) {
        throw new Error("Admin bulunamadı");
      }

      // Gelen değer, mevcut kullanıcı adıyla aynıysa sorun yok
      if (value === currentUser.username) {
        return true;
      }

      // Aynı kullanıcı adından başka varsa hata ver
      const existingUser = await User.findOne({
        where: {
          username: value,
          id: { [Op.ne]: id },
        },
      });

      if (existingUser) {
        throw new Error("Kullanıcı adı zaten kullanımda");
      }

      return true;
    }),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Telefon numarası alanı zorunludur")
    .optional()
    .matches(/^(\+?\d{1,4}[-.\s]?)?\d{10}$/)
    .withMessage("Geçerli bir telefon numarası girin"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("Şehir alanı zorunludur")
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage("Şehir adı en az 3, en fazla 50 karakter olmalıdır"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateProfileUpdateUser = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("İsim alanı zorunludur")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("İsim en az 2, en fazla 50 karakter olmalıdır"),

  body("surname")
    .trim()
    .notEmpty()
    .withMessage("Soyisim alanı zorunludur")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Soyisim en az 2, en fazla 50 karakter olmalıdır"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Kullanıcı adı alanı zorunludur")
    .isLength({ min: 3, max: 30 })
    .withMessage("Kullanıcı adı en az 3, en fazla 30 karakter olmalıdır")
    .custom(async (value, { req }) => {
      const id = req.user.id;

      const currentUser = await User.findByPk(id);
      if (!currentUser) {
        throw new Error("Admin bulunamadı");
      }

      // Gelen değer, mevcut kullanıcı adıyla aynıysa sorun yok
      if (value === currentUser.username) {
        return true;
      }

      // Aynı kullanıcı adından başka varsa hata ver
      console.log("Gelen kullanıcı adı:", value);
      const existingUser = await User.findOne({
        where: {
          username: value,
          id: { [Op.ne]: id }, // Aynı id'ye sahip admin dışındaki kullanıcıları kontrol et
        },
      });

      if (existingUser) {
        throw new Error("Kullanıcı adı zaten kullanımda");
      }

      return true;
    }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("E-posta adresi alanı zorunludur")
    .isEmail()
    .withMessage("Geçerli bir e-posta adresi girin")
    .custom(async (value, { req }) => {
      const id = req.user.id;

      const currentUser = await User.findByPk(id);
      if (!currentUser) {
        throw new Error("User bulunamadı");
      }

      // Gelen değer, mevcut kullanıcı adıyla aynıysa sorun yok
      if (value === currentUser.email) {
        return true;
      }

      // Aynı kullanıcı adından başka varsa hata ver
      console.log("Gelen kullanıcı adı:", value);
      const existingUser = await User.findOne({
        where: {
          email: value,
          id: { [Op.ne]: id }, // Aynı id'ye sahip admin dışındaki kullanıcıları kontrol et
        },
      });

      if (existingUser) {
        throw new Error("Kullanıcı adı zaten kullanımda");
      }

      return true;
    }),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Telefon numarası alanı zorunludur")
    .matches(/^(\+?\d{1,4}[-.\s]?)?\d{10}$/)
    .withMessage("Geçerli bir telefon numarası girin"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("Şehir alanı zorunludur")
    .isLength({ min: 3, max: 50 })
    .withMessage("Şehir adı en az 3, en fazla 50 karakter olmalıdır"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePasswordUser = [
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Şifre alanı zorunludur")
    .isLength({ min: 8 })
    .withMessage("Şifre en az 8 karakter olmalıdır")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&.])[A-Za-z\d@$!%?&.]{8,}$/
    )
    .withMessage(
      "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir."
    ),
];

// JWT Token doğrulama (Header üzerinden Bearer Token alır)
export const checkAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized User" });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// 🍪 Cookie tabanlı oturum doğrulama

export const isAuth = async (req, res, next) => {
  console.log("🛠 Middleware Çalıştı!");

  // Cookie ve Authorization Header'ı kontrol etme
  const tokenFromCookie = req.cookies?.token;
  let token = tokenFromCookie;

  console.log("🍪 Gelen Cookie:", tokenFromCookie);
  console.log("🧾 Authorization Header:", req.headers.authorization);

  // Authorization Header'dan token al
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Token yoksa 401 döndür
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized User",
    });
  }

  try {
    // Token'ı doğrulama
    const decodeData = JWT.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı veritabanında bulma
    req.user = await User.findByPk(decodeData.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("👤 Bulunan Kullanıcı:", req.user);
    next(); // Kullanıcı doğrulandıktan sonra işlemi devam ettir
  } catch (error) {
    // Token geçersizse hata mesajı döndür
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export const isAdminAuth = async (req, res, next) => {
  console.log("🛠 Middleware Çalıştı!");
  console.log("🍪 Gelen Cookie:", req.cookies);

  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized User",
    });
  }

  try {
    const decodeData = JWT.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decodeData.id);

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    console.log("👤 Bulunan Kullanıcı:", req.user);

    // Admin yetkilendirmesi kontrolü
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin or Superadmin access required",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer token" formatında geldiğini varsayıyoruz

  if (!token) {
    return res.status(401).json({ message: "Token bulunamadı." });
  }

  // Token'ı doğrula
  JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Geçersiz token." });
    }

    // Decoded user information'ı request objesine ekliyoruz
    req.user = decoded;
    next();
  });
};
