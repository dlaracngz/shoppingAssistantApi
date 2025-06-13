import { sequelize } from "../config/db.js";
import marketModel from "../models/marketModels.js";
import productMarketModel from "../models/productmarketModels.js";
import cloudinary from "cloudinary";
import { getDataUri } from "../utils/features.js";
import { Op } from "sequelize";
import Markets from "../models/marketModels.js";
import Admin from "../models/adminModels.js";

export const addMarket = async (req, res) => {
  try {
    const { marketName, marketPhone, adminId, marketLocation } = req.body;

    if (!marketName || !marketPhone || !adminId || !marketLocation) {
      return res.status(400).send({
        success: false,
        message: "Lütfen tüm alanları doldurun",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Lütfen market görseli yükleyin",
      });
    }

    const existingMarket = await marketModel.findOne({
      where: { marketName },
    });

    if (existingMarket) {
      return res.status(400).send({
        success: false,
        message: "Market zaten mevcut",
      });
    }

    const fileUri = getDataUri(req.file);
    const cdb = await cloudinary.v2.uploader.upload(fileUri.content);

    const market = await marketModel.create({
      marketName,
      marketPhone,
      marketLocation, // ✅ Artık string olarak direkt kaydediyoruz
      marketImage: {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      },
      adminId,
    });

    res.status(201).send({
      success: true,
      message: "Market başarıyla eklendi",
      market,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Market eklenirken bir hata oluştu",
      error: error.message,
    });
  }
};

export const getMarkets = async (req, res) => {
  try {
    const markets = await marketModel.findAll();
    res.status(200).json(markets);
  } catch (error) {
    res.status(500).json({ error: "sunucu hatası" });
  }
};

export const getMarketById = async (req, res) => {
  try {
    const market = await marketModel.findByPk(req.params.id);

    if (!market) {
      return res.status(404).json({ error: "Market bulunamadı" });
    }

    const formattedMarket = {
      id: market.id,
      marketName: market.marketName,
      marketLocation: market.marketLocation || "", // 👉 Artık sadece string
      marketPhone: market.marketPhone,
      marketImage: market.marketImage,
    };

    res.status(200).json({
      success: true,
      message: "Market bilgisi getirildi",
      market: formattedMarket,
    });
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
};
//giriş yapmış adminin bilgilerini getiren fonksiyon
export const getAdminMarketNew = async (req, res) => {
  try {
    const adminId = req.admin.id;

    // Admin'e ait tek bir market getiriyoruz
    const market = await Markets.findOne({
      where: { adminId },
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Adminin sahip olduğu market bulunamadı",
      });
    }

    // Marketi başarıyla döndür
    res.status(200).json({ success: true, data: market });
  } catch (error) {
    console.error("❌ Hata:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

export const getMarketData = async (req, res) => {
  try {
    const market = await Markets.findAll({
      include: [
        {
          model: Admin,
          attributes: [
            "id",
            "name",
            "surname",
            "username",
            "email",
            "city",
            "phoneNumber",
            "adminRole",
            "profilePic",
          ],
        },
      ],
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market bulunamadı.",
      });
    }

    res.status(200).json({
      success: true,
      data: market,
    });
  } catch (error) {
    console.error("❌ Hata:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    });
  }
};

export const updateMarket = async (req, res) => {
  try {
    const { id } = req.params;
    const { marketName, marketLocation, marketPhone, adminId } = req.body;

    const market = await marketModel.findByPk(id);
    if (!market) {
      return res.status(404).json({ message: "Market not found" });
    }

    if (marketName && marketName !== market.marketName) {
      const existingMarketname = await marketModel.findOne({
        where: {
          marketName,
          id: { [Op.ne]: market.id },
        },
      });
      if (existingMarketname) {
        return res.status(400).json({
          success: false,
          message: "Bu market zaten kullanımda",
        });
      }
    }

    let updatedImage = market.marketImage;

    if (req.file) {
      if (market.marketImage && market.marketImage.public_id) {
        await cloudinary.v2.uploader.destroy(market.marketImage.public_id);
      }

      const fileUri = getDataUri(req.file);
      const cdb = await cloudinary.v2.uploader.upload(fileUri.content);

      updatedImage = {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      };
    }

    await market.update({
      marketName: marketName || market.marketName,
      marketLocation: marketLocation || market.marketLocation, // ✅ artık string
      marketPhone: marketPhone || market.marketPhone,
      marketImage: updatedImage,
      adminId: adminId || market.adminId,
    });

    res.status(200).json({
      success: true,
      message: "Market updated successfully",
      market,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteMarket = async (req, res) => {
  const transaction = await sequelize.transaction(); // Transaction başlat

  try {
    const { id } = req.params;

    // Marketi bul
    const market = await marketModel.findByPk(id, { transaction });

    if (!market) {
      await transaction.rollback(); // Hata durumunda işlemi geri al
      return res.status(404).json({ message: "Market not found" });
    }

    // Önce market ile ilişkili tüm product-market kayıtlarını sil
    await productMarketModel.destroy({
      where: { marketId: id },
      transaction, // Transaction ile silme işlemi
    });

    // Marketi sil
    await market.destroy({ transaction });

    await transaction.commit(); // Başarılıysa transaction'ı commit et

    res.status(200).json({
      success: true,
      message: "Market and its products deleted successfully",
    });
  } catch (error) {
    await transaction.rollback(); // Hata durumunda işlemi geri al
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAdminMarket = async (req, res) => {
  try {
    // URL parametresinden id'yi alıyoruz
    const marketId = req.params.id;

    // Marketi buluyoruz
    const market = await Markets.findOne({
      where: {
        id: marketId, // Parametreden alınan market id'sine göre sorgulama yapıyoruz
      },
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market bulunamadı.",
      });
    }

    // Marketi döndürüyoruz
    res.status(200).json({ success: true, data: market });
  } catch (error) {
    console.error("❌ Hata:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
