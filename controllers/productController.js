import productModel from "../models/productModels.js";
import cloudinary from "cloudinary";
import { getDataUri } from "../utils/features.js";
import { sequelize } from "../config/db.js";
import productMarketModel from "../models/productmarketModels.js";
import Categories from "../models/categoryModels.js";
import Brands from "../models/brandModels.js";

export const addProduct = async (req, res) => {
  try {
    const { productName, productGr, productContents, categoryId, brandId } =
      req.body;

    if (
      !productName ||
      !productGr ||
      !productContents ||
      !categoryId ||
      !brandId
    ) {
      return res.status(400).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).send({
        success: false,
        message: "Lütfen bir ürün fotoğrafı yükleyin",
      });
    }

    const fileUri = getDataUri(req.file);
    console.log("File URI: ", fileUri);
    const cdb = await cloudinary.v2.uploader.upload(fileUri.content);
    console.log("Cloudinary response: ", cdb);

    const product = await productModel.create({
      productName,
      productGr,
      productImage: {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      },
      productContents,
      categoryId,
      brandId,
    });

    res.status(201).send({
      success: true,
      message: "Product added",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in Product API",
      error: error.message,
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const products = await productModel.findAll();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "sunucu hatası" });
  }
};

export const getProductData = async (req, res) => {
  try {
    const products = await productModel.findAll({
      include: [
        {
          model: Categories,
          attributes: ["id", "categoryName"],
        },
        {
          model: Brands,
          attributes: ["id", "brandName"],
        },
      ],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching product data:", error);
    res.status(500).json({ message: "Sunucu hatası", error });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productModel.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    res.status(200).json({
      success: true,
      message: "Product bilgisi getirildi",
      product,
    });
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, productGr, productContents, categoryId, brandId } =
      req.body;

    const product = await productModel.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let updatedImage = product.productImage;

    if (req.file) {
      // Cloudinary'den eski resmi sil (isteğe bağlı)
      if (product.productImage && product.productImage.public_id) {
        await cloudinary.v2.uploader.destroy(product.productImage.public_id);
      }

      const fileUri = getDataUri(req.file);
      const cdb = await cloudinary.v2.uploader.upload(fileUri.content);

      updatedImage = {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      };
    }

    await product.update({
      productName,
      productGr,
      productImage: updatedImage,
      productContents,
      categoryId,
      brandId,
    });
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const product = await productModel.findByPk(id);

    if (!product) {
      await transaction.rollback(); // Hata durumunda işlemi geri al
      return res.status(404).json({ message: "Product not found" });
    }

    await productMarketModel.destroy({
      where: { productId: id },
      transaction, // Transaction içinde işlem yapıyoruz
    });

    await product.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};
