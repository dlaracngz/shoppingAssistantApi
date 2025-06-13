import { body, validationResult } from "express-validator";
import Brands from "../models/brandModels.js";
import { Op } from "sequelize";

export const validateBrand = [
  body("brandName")
    .trim()
    .notEmpty()
    .withMessage("Marka adı zorunludur")
    .isLength({ min: 3 })
    .withMessage("Marka adı en az 3 karakter olmalıdır")
    .custom(async (value, { req }) => {
      const existingBrand = await Brands.findOne({
        where: {
          brandName: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingBrand && existingBrand.id !== req.body.id) {
        throw new Error("Marka adı zaten kullanımda");
      }
    }),

  // Hata kontrolü
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        errors: [
          {
            msg: "Marka görseli zorunludur",
            param: "brandImage",
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

export const validateUpdateBrand = [
  // brandName boş olamaz ve en az 2 karakter olmalı
  body("brandName")
    .trim()
    .notEmpty()
    .withMessage("Marka adı boş olamaz")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Marka adı en az 3 karakter olmalıdır")
    .bail()
    .custom(async (value, { req }) => {
      const id = req.params.id;
      const currentBrand = await Brands.findByPk(id);

      if (!currentBrand) {
        throw new Error("Marka bulunamadı");
      }

      // Aynı adla güncelleniyorsa kontrol yapmaya gerek yok
      if (value === currentBrand.brandName) {
        return true;
      }

      const existingBrand = await Brands.findOne({
        where: {
          brandName: value,
          id: { [Op.ne]: id },
        },
      });

      if (existingBrand) {
        throw new Error("Bu marka zaten kullanımda");
      }

      return true;
    }),

  // Görsel boş olamaz ama değişmek zorunda değil
  body("brandImage").custom((_, { req }) => {
    if (!req.file && !req.existingImage) {
      throw new Error("Marka görseli boş olamaz");
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
