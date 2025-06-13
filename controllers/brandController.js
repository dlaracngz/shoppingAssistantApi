import brandModel from "../models/brandModels.js";
import cloudinary from "cloudinary";
import { getDataUri } from "../utils/features.js";
import productModel from "../models/productModels.js";
import { Op } from "sequelize";
import { sequelize } from "../config/db.js";

export const addBrand = async (req, res) => {
  try {
    const { brandName } = req.body;

    // brandName boş mu kontrolü
    if (!brandName) {
      return res.status(400).send({
        success: false,
        message: "Lütfen marka adını giriniz",
      });
    }

    // Dosya kontrolü (zorunlu tutmak için)
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Lütfen bir marka logosu yükleyin",
      });
    }

    // Marka zaten var mı kontrolü
    const existingBrand = await brandModel.findOne({ where: { brandName } });

    if (existingBrand) {
      return res.status(400).send({
        success: false,
        message: "Bu marka zaten eklenmiş",
      });
    }

    // Resmi Cloudinary'e yükleme
    const fileUri = getDataUri(req.file);
    const cdb = await cloudinary.v2.uploader.upload(fileUri.content);

    // Marka oluşturma
    const brand = await brandModel.create({
      brandName,
      brandImage: {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      },
    });

    res.status(201).send({
      success: true,
      message: "Marka başarıyla eklendi",
      brand,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Marka ekleme işlemi başarısız oldu",
      error: error.message,
    });
  }
};

export const getBrands = async (req, res) => {
  try {
    const brands = await brandModel.findAll();
    res.status(200).json({
      success: true,
      brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Markaları alırken bir hata oluştu",
      error: error.message,
    });
  }
};

export const getBrandById = async (req, res) => {
  try {
    const brand = await brandModel.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({ error: "Marka bulunamadı" });
    }

    const formattedBrand = {
      id: brand.id,
      brandName: brand.brandName,
      brandImage: brand.brandImage, // Cloudinary URL veya başka bir formatta olabilir
    };

    res.status(200).json({
      success: true,
      message: "Marka bilgisi getirildi",
      brand: formattedBrand,
    });
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandName } = req.body;

    const brand = await brandModel.findByPk(id);
    if (!brand) {
      return res.status(404).json({ message: "Marka bulunamadı" });
    }

    // Validator'da kullanmak için mevcut görseli ekle (gerekirse)
    req.existingImage = brand.brandImage;

    // Eğer ad değiştirildiyse (ve zaten aynı değilse) kontrol yapıldı zaten

    // Görsel değiştirildiyse
    if (req.file) {
      if (brand.brandImage?.public_id) {
        await cloudinary.v2.uploader.destroy(brand.brandImage.public_id);
      }

      const fileUri = getDataUri(req.file);
      const uploaded = await cloudinary.v2.uploader.upload(fileUri.content);

      brand.brandImage = {
        public_id: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    // Güncellemeleri kaydet
    brand.brandName = brandName;
    await brand.save();

    res.status(200).json({
      success: true,
      message: "Marka başarıyla güncellendi",
      brand,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  const transaction = await sequelize.transaction(); // Transaction başlat

  try {
    const { id } = req.params;

    // Marketi bul
    const brand = await brandModel.findByPk(id, { transaction });

    if (!brand) {
      await transaction.rollback(); // Hata durumunda işlemi geri al
      return res.status(404).json({ message: "Brand not found" });
    }

    await productModel.destroy({
      where: { brandId: id },
      transaction, // Transaction ile silme işlemi
    });

    // Marketi sil
    await brand.destroy({ transaction });

    await transaction.commit(); // Başarılıysa transaction'ı commit et

    res.status(200).json({
      success: true,
      message: "Brand and its products deleted successfully",
    });
  } catch (error) {
    await transaction.rollback(); // Hata durumunda işlemi geri al
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
};
