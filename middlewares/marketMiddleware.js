import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import Markets from "../models/marketModels.js";

export const validateMarket = [
  body("marketName")
    .trim()
    .notEmpty()
    .withMessage("Market adı zorunludur")
    .isLength({ min: 2 })
    .withMessage("Market adı en az 2 karakter olmalıdır")
    .custom(async (value, { req }) => {
      const existingMarket = await Markets.findOne({
        where: {
          marketName: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingMarket) {
        throw new Error("Market adı zaten kullanımda");
      }
    }),

  body("marketLocation")
    .trim()
    .notEmpty()
    .withMessage("Market konumu zorunludur")
    .isLength({ min: 2 })
    .withMessage("Market konumu geçerli değil"),

  body("marketPhone")
    .trim()
    .notEmpty()
    .withMessage("Telefon numarası zorunludur")
    .matches(/^(\+?\d{1,4}[-.\s]?)?\d{10}$/)
    .withMessage("Geçerli bir telefon numarası girin"),

  // Görsel kontrolü
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        errors: [
          {
            msg: "Market görseli zorunludur",
            param: "marketImage",
            location: "file",
          },
        ],
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  },
];

export const validateMarketUpdate = [
  body("marketName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Market adı en az 2 karakter olmalıdır")
    .custom(async (value, { req }) => {
      if (!value) return true;

      const existingMarket = await Markets.findOne({
        where: {
          marketName: value,
          ...(req.params.id ? { id: { [Op.ne]: req.params.id } } : {}),
        },
      });
      if (existingMarket) {
        throw new Error("Market adı zaten kullanımda");
      }
    }),

  body("marketLocation")
    .optional()
    .isString()
    .withMessage("Konum metin formatında olmalıdır"),

  body("marketPhone")
    .optional()
    .trim()
    .matches(/^(\+?\d{1,4}[-.\s]?)?\d{10}$/)
    .withMessage("Geçerli bir telefon numarası girin"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
