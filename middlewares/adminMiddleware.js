import JWT from "jsonwebtoken";
import Admin from "../models/adminModels.js";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";

export const validateAdmin = [
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
      const existingAdmin = await Admin.findOne({
        where: {
          username: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingAdmin && existingAdmin.id !== req.body.id) {
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
      const existingAdmin = await Admin.findOne({
        where: {
          email: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingAdmin && existingAdmin.id !== req.body.id) {
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

  body("city")
    .trim()
    .notEmpty()
    .withMessage("Şehir alanı zorunludur")
    .isLength({ min: 3, max: 50 })
    .withMessage("Şehir adı en az 3, en fazla 50 karakter olmalıdır"),

  body("adminRole")
    .notEmpty()
    .withMessage("Admin rolü alanı zorunludur")
    .isIn(["super-admin", "admin"])
    .withMessage("Geçersiz rol seçildi"),

  // Hata kontrolü
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateAdmin = [
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

      const currentAdmin = await Admin.findByPk(id);
      if (!currentAdmin) {
        throw new Error("Admin bulunamadı");
      }

      // Gelen değer, mevcut kullanıcı adıyla aynıysa sorun yok
      if (value === currentAdmin.username) {
        return true;
      }

      // Aynı kullanıcı adından başka varsa hata ver
      const existingAdmin = await Admin.findOne({
        where: {
          username: value,
          id: { [Op.ne]: id },
        },
      });

      if (existingAdmin) {
        throw new Error("Kullanıcı adı zaten kullanımda");
      }

      return true;
    }),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Şifre alanı zorunludur")
    .optional()
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
    .withMessage("Telefon numarası alanı zorunludur")
    .optional()
    .matches(/^(\+?\d{1,4}[-.\s]?)?\d{10}$/)
    .withMessage("Geçerli bir telefon numarası girin"),

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

  body("city")
    .trim()
    .notEmpty()
    .withMessage("Şehir alanı zorunludur")
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage("Şehir adı en az 3, en fazla 50 karakter olmalıdır"),

  body("adminRole")
    .notEmpty()
    .withMessage("Admin rol alanı zorunludur")
    .optional()
    .isIn(["super-admin", "admin"])
    .withMessage("Geçersiz rol seçildi"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateProfileUpdateAdmin = [
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
    .optional()
    .withMessage("Kullanıcı adı alanı zorunludur")
    .isLength({ min: 3, max: 30 })
    .withMessage("Kullanıcı adı en az 3, en fazla 30 karakter olmalıdır")
    .custom(async (value, { req }) => {
      const id = req.admin.id;

      const currentAdmin = await Admin.findByPk(id);
      if (!currentAdmin) {
        throw new Error("Admin bulunamadı");
      }

      // Gelen değer, mevcut kullanıcı adıyla aynıysa sorun yok
      if (value === currentAdmin.username) {
        return true;
      }

      // Aynı kullanıcı adından başka varsa hata ver
      console.log("Gelen kullanıcı adı:", value);
      const existingAdmin = await Admin.findOne({
        where: {
          username: value,
          id: { [Op.ne]: id }, // Aynı id'ye sahip admin dışındaki kullanıcıları kontrol et
        },
      });

      if (existingAdmin) {
        throw new Error("Kullanıcı adı zaten kullanımda");
      }

      return true;
    }),

  body("email")
    .trim()
    .notEmpty()
    .optional()
    .withMessage("E-posta adresi alanı zorunludur")
    .isEmail()
    .withMessage("Geçerli bir e-posta adresi girin")
    .custom(async (value, { req }) => {
      const id = req.admin.id;

      const currentAdmin = await Admin.findByPk(id);
      if (!currentAdmin) {
        throw new Error("Admin bulunamadı");
      }

      // Gelen değer, mevcut kullanıcı adıyla aynıysa sorun yok
      if (value === currentAdmin.email) {
        return true;
      }

      // Aynı kullanıcı adından başka varsa hata ver
      console.log("Gelen kullanıcı adı:", value);
      const existingAdmin = await Admin.findOne({
        where: {
          email: value,
          id: { [Op.ne]: id }, // Aynı id'ye sahip admin dışındaki kullanıcıları kontrol et
        },
      });

      if (existingAdmin) {
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

  body("city")
    .trim()
    .notEmpty()
    .withMessage("Şehir alanı zorunludur")
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage("Şehir adı en az 3, en fazla 50 karakter olmalıdır"),

  body("adminRole")
    .notEmpty()
    .withMessage("Admin rol alanı zorunludur")
    .optional()
    .isIn(["super-admin", "admin"])
    .withMessage("Geçersiz rol seçildi"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePasswordAdmin = [
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

export const checkAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Admin" });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const isAdminAuth = async (req, res, next) => {
  console.log("🛠 Admin Middleware Çalıştı!");

  // Cookie ve Authorization Header'ı kontrol etme
  const tokenFromCookie = req.cookies?.token;
  let token = tokenFromCookie;

  console.log("🍪 Gelen Cookie:", tokenFromCookie);
  console.log("🧾 Authorization Header:", req.headers.authorization);

  // Authorization Header'dan token al
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Yetkisiz giriş — Admin girişi gerekli.",
    });
  }

  try {
    const decodeData = JWT.verify(token, process.env.JWT_SECRET);
    console.log("🧾 decodeData:", decodeData); // << BURASI
    req.admin = await Admin.findByPk(decodeData.id);

    if (!req.admin) {
      return res
        .status(401)
        .json({ success: false, message: "Admin bulunamadı" });
    }

    console.log("👤 Giriş Yapan Admin:", req.admin);
    next();
  } catch (error) {
    console.error("❌ Token doğrulanamadı:", err);
    return res.status(401).json({ success: false, message: "Geçersiz token" });
  }
};
