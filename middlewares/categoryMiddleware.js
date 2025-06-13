import { body, validationResult } from "express-validator";
import Categories from "../models/categoryModels.js";
import { Op } from "sequelize";

export const validateCategory = [
  body("categoryName")
    .trim()
    .notEmpty()
    .withMessage("Kategori adı zorunludur")
    .isLength({ min: 1 })
    .withMessage("Kategori adı en az 1 karakter olmalıdır")
    .custom(async (value, { req }) => {
      const existingCategory = await Categories.findOne({
        where: {
          categoryName: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingCategory) {
        throw new Error("Kategori adı zaten kullanımda");
      }
    }),

  // Hata kontrolü
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        errors: [
          {
            msg: "Marka görseli zorunludur",
            param: "categoryImage",
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

export const validateCategoryUpdate = [
  // categoryName boş olamaz ve en az 2 karakter olmalı
  body("categoryName")
    .trim()
    .notEmpty()
    .withMessage("Kategori adı boş olamaz")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Kategori adı en az 3 karakter olmalıdır")
    .bail()
    .custom(async (value, { req }) => {
      const id = req.params.id;
      const currentCategory = await Categories.findByPk(id);
      if (!currentCategory) {
        throw new Error("Kategori bulunamadı");
      }
      // Aynı adla güncelleniyorsa kontrol yapmaya gerek yok
      if (value === currentCategory.categoryName) {
        return true;
      }
      const existingCategory = await Categories.findOne({
        where: {
          categoryName: value,
          id: { [Op.ne]: id },
        },
      });
      if (existingCategory) {
        throw new Error("Bu kategori zaten kullanımda");
      }
      return true;
    }),

  // Görsel kontrolü: Eğer görsel yüklenmediyse mevcut görselin varlığı kontrol edilecek
  body("categoryImage").custom((_, { req }) => {
    if (!req.file && !req.existingImage) {
      throw new Error("Kategori görseli boş olamaz");
    }
    return true;
  }),

  // Hata kontrolü
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
