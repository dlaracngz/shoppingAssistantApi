import { body, validationResult } from "express-validator";
import Products from "../models/productModels.js";
import { Op } from "sequelize";

export const validateProduct = [
  body("productName")
    .trim()
    .notEmpty()
    .withMessage("Ürün adı zorunludur")
    .isLength({ min: 3 })
    .withMessage("Ürün adı en az 3 karakterli olmalı")
    .custom(async (value, { req }) => {
      const existingProduct = await Products.findOne({
        where: {
          productName: value,
          ...(req.body.id ? { id: { [Op.ne]: req.body.id } } : {}),
        },
      });
      if (existingProduct && existingProduct.id !== req.body.id) {
        throw new Error("Ürün adı zaten kullanımda");
      }
    }),

  body("productGr")
    .notEmpty()
    .withMessage("Ürün gramı alanı girilmesi zorunludur")
    .isNumeric()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isInt()
    .withMessage("Ürün gramı tam sayı olmalıdır")
    .custom((value) => value > 0)
    .withMessage("Ürün gramı pozitif bir değer olmalıdır"),

  body("productContents")
    .trim()
    .notEmpty()
    .withMessage("İçindekiler alanı girilmesi zorunludur")
    .isLength({ min: 5 })
    .withMessage("İçindekiler alanı en az 5 karakter olmalı"),

  body("categoryId")
    .notEmpty()
    .withMessage("Kategori ID alanı girilmesi zorunludur")
    .isInt({ min: 1 })
    .withMessage("Kategori ID geçerli bir sayı olmalıdır"),

  body("brandId")
    .notEmpty()
    .withMessage("Marka ID alanı girilmesi zorunludur")
    .isInt({ min: 1 })
    .withMessage("Marka ID geçerli bir sayı olmalıdır"),

  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        errors: [
          {
            msg: "Ürün görseli zorunludur",
            param: "productImage",
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

export const validateUpdateProduct = [
  body("productName")
    .trim()
    .notEmpty()
    .withMessage("Marka adı boş olamaz")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Ürün adı en az 3 karakterli olmalı")
    .custom(async (value, { req }) => {
      const id = req.params.id;
      const currentProduct = await Products.findByPk(id);

      if (!currentProduct) {
        throw new Error("Ürün bulunamadı");
      }

      // Aynı adla güncelleniyorsa kontrol yapmaya gerek yok
      if (value === currentProduct.productName) {
        return true;
      }

      const existingProduct = await Products.findOne({
        where: {
          productName: value,
          id: { [Op.ne]: id },
        },
      });

      if (existingProduct) {
        throw new Error("Bu ürün zaten kullanımda");
      }

      return true;
    }),

  body("productGr")
    .optional()
    .isNumeric()
    .withMessage("Lütfen sayısal bir değer giriniz")
    .isInt()
    .withMessage("Ürün gramı tam sayı olmalıdır")
    .custom((value) => value > 0)
    .withMessage("Ürün gramı pozitif bir değer olmalıdır"),

  body("productContents")
    .trim()
    .optional()
    .isLength({ min: 5 })
    .withMessage("İçindekiler alanı en az 5 karakter olmalı"),

  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Kategori ID geçerli bir sayı olmalıdır"),

  body("brandId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Marka ID geçerli bir sayı olmalıdır"),

  body("productImage").custom((_, { req }) => {
    if (!req.file && !req.existingImage) {
      throw new Error("Ürün görseli boş olamaz");
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
