import { body, validationResult } from "express-validator";
import JWT from "jsonwebtoken";
import product_Market from "../models/productmarketModels.js";
import { Op } from "sequelize";

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
};

export const validateProductMarket = [
  body("productId")
    .notEmpty()
    .withMessage("Ürün ID alanı girilmesi zorunludur")
    .isInt({ min: 1 })
    .withMessage("Ürün ID geçerli bir sayı olmalıdır")
    .custom(async (value, { req }) => {
      const existing = await product_Market.findOne({
        where: {
          productId: value,
          marketId: req.body.marketId,
        },
      });

      if (existing) {
        throw new Error("Bu ürün bu markette zaten mevcut");
      }

      return true;
    }),

  body("marketId")
    .notEmpty()
    .withMessage("Market ID alanı girilmesi zorunludur")
    .isInt({ min: 1 })
    .withMessage("Market ID geçerli bir sayı olmalıdır"),

  body("regularPrice")
    .notEmpty()
    .withMessage("Normal fiyat alanı girilmesi zorunludur")
    .isFloat()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isFloat({ min: 0.01 })
    .withMessage("Normal fiyatı pozitif bir değer olmalıdır"),

  body("discountPrice")
    .optional()
    .isFloat()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isFloat({ min: 0.01 })
    .withMessage("İndirimli fiyat pozitif bir rdeğer olmalıdır"),

  body("discountRate")
    .optional()
    .isFloat()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isFloat({ min: 0.01 })
    .withMessage("İndirim yüzdesi pozitif bir değer olmalıdır"),

  body("stockAmount")
    .notEmpty()
    .withMessage("Stok miktarı alanı girilmesi zorunludur")
    .isInt()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isInt({ min: 0 })
    .withMessage("Stok miktarı eksi bir değer olamaz"),

  body("startDate")
    .optional()
    .isDate()
    .withMessage("Başlangıç tarihi geçerli bir tarih olmalıdır"),

  body("endDate")
    .optional()
    .isDate()
    .withMessage("Bitiş tarihi geçerli bir tarih olmalıdır"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateProductMarket = [
  body("productId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Ürün ID geçerli bir sayı olmalıdır")
    .custom(async (value, { req }) => {
      const marketId = req.body.marketId;

      if (!marketId) {
        return true;
      }
      const id = req.params.id;

      // Aynı productId ve marketId'ye sahip, ama farklı id'li kayıt var mı?
      const existing = await product_Market.findOne({
        where: {
          productId: value,
          marketId: marketId,
          id: { [Op.ne]: id }, // Sequelize için "id !== id"
        },
      });

      if (existing) {
        throw new Error("Bu ürün bu markette zaten mevcut");
      }

      return true;
    }),

  body("marketId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Market ID geçerli bir sayı olmalıdır"),

  body("regularPrice")
    .optional()
    .isFloat()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isFloat({ min: 0.01 })
    .withMessage("Normal fiyatı pozitif bir değer olmalıdır"),

  body("discountPrice")
    .optional()
    .isFloat()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isFloat({ min: 0.01 })
    .withMessage("İndirimli fiyat pozitif bir rdeğer olmalıdır"),

  body("discountRate")
    .optional()
    .isFloat()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isFloat({ min: 0.01 })
    .withMessage("İndirim yüzdesi pozitif bir değer olmalıdır"),

  body("stockAmount")
    .optional()
    .isInt()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isInt({ min: 0 })
    .withMessage("Stok miktarı eksi bir değer olamaz"),

  body("startDate")
    .optional()
    .isDate()
    .withMessage("Başlangıç tarihi geçerli bir tarih olmalıdır")
    .custom((value) => {
      // Tarihi kontrol et ve formatla
      const formattedDate = formatDate(new Date(value));
      if (!formattedDate) {
        throw new Error("Başlangıç tarihi geçerli bir tarih olmalıdır");
      }
      return true; // validasyon başarılı
    }),

  body("endDate")
    .optional()
    .isDate()
    .withMessage("Bitiş tarihi geçerli bir tarih olmalıdır")
    .custom((value) => {
      // Tarihi kontrol et ve formatla
      const formattedDate = formatDate(new Date(value));
      if (!formattedDate) {
        throw new Error("Bitiş tarihi geçerli bir tarih olmalıdır");
      }
      return true; // validasyon başarılı
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  console.log("Gelen Authorization Header:", req.headers.authorization);
  console.log("Çözülen Token:", token);

  if (!token) {
    return res.status(401).json({ error: "Yetkisiz erişim (Token yok)" });
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    console.log("JWT decode edildi:", decoded);

    req.admin = { id: decoded.id };
    next();
  } catch (err) {
    console.error("Token doğrulama hatası:", err.message);
    return res.status(403).json({ error: "Geçersiz token" });
  }
};
