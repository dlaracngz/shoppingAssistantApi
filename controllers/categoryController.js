import categoryModel from "../models/categoryModels.js";
import { sequelize } from "../config/db.js";
import productModel from "../models/productModels.js";
import cloudinary from "cloudinary";
import { getDataUri } from "../utils/features.js";
import { Op } from "sequelize";

export const addCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName) {
      return res.status(400).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Lütfen bir marka logosu yükleyin",
      });
    }

    const existingCategory = await categoryModel.findOne({
      where: { categoryName },
    });

    if (existingCategory) {
      return res.status(400).send({
        success: false,

        message: "Category already taken",
      });
    }

    const fileUri = getDataUri(req.file);
    const cdb = await cloudinary.v2.uploader.upload(fileUri.content);

    const category = await categoryModel.create({
      categoryName,
      categoryImage: {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      },
    });

    res.status(201).send({
      success: true,
      message: "Category is added",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in addCategory",
      error: error.message,
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "sunucu hatası" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ eroor: error.message });
  }
};

export const updateCategory = async (req, res) => {
  console.log("aaaaaa");
  try {
    const { id } = req.params;
    const { categoryName } = req.body;
    const category = await categoryModel.findByPk(id);

    if (!category) {
      return res.status(404).json({ message: "Kategori bulunamadı." });
    }

    // Mevcut görseli kaydet
    req.existingImage = category.categoryImage;

    // Yeni görsel varsa, mevcut görseli kaldır
    if (req.file) {
      if (category.categoryImage?.public_id) {
        await cloudinary.v2.uploader.destroy(category.categoryImage.public_id);
      }

      const fileUri = getDataUri(req.file); // Dosya URI'sini al
      const uploaded = await cloudinary.v2.uploader.upload(fileUri.content);

      // Yeni görseli kaydet
      category.categoryImage = {
        public_id: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    // Kategori adını güncelle
    category.categoryName = categoryName;

    // Kategoriyi kaydet
    await category.save();

    console.log(req.body); // Tüm form verilerini kontrol et
    console.log(req.file);

    res.status(200).json({
      success: true,
      message: "Kategori başarıyla güncellendi", // Mesajı düzelt
      category, // Kategori verisini gönder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const category = await categoryModel.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await productModel.destroy({
      where: { categoryId: id },
      transaction, // Transaction içinde işlem yapıyoruz
    });

    await category.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    req.status(500).json({ error: error.message });
  }
};
