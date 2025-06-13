import Favorites from "../models/favoriteModels.js";
import favoriteModel from "../models/favoriteModels.js";
import Products from "../models/productModels.js";
import product_Market from "../models/productmarketModels.js";
import Markets from "../models/marketModels.js";
import User from "../models/userModels.js";

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productMarketId } = req.body;

    if (!productMarketId) {
      return res.status(400).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    const alreadyFavorited = await favoriteModel.findOne({
      where: { userId, productMarketId },
    });

    if (alreadyFavorited) {
      return res.status(400).send({
        success: false,
        message: "Product is already in favorites",
      });
    }

    // Favoriyi oluştur
    const favorite = await favoriteModel.create({
      userId,
      productMarketId,
    });

    // Oluşturduktan sonra ilişkili modellerle beraber favoriyi getir
    const favourite = await favoriteModel.findOne({
      where: { id: favorite.id },
      include: [
        {
          model: product_Market,
          include: [
            {
              model: Products,
              attributes: ["id", "productName", "productImage", "productGr"],
            },
            {
              model: Markets,
              attributes: ["id", "marketName", "marketLocation"],
            },
          ],
        },
      ],
    });

    res.status(201).send({
      success: true,
      message: "Cart added",
      favourite,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in Favorite API",
      error: error.message,
    });
  }
};

export const getFavorite = async (req, res) => {
  try {
    const favorites = await favoriteModel.findAll();
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ error: "sunucu hatası" });
  }
};

// Giriş yapmış kullanıcının fav listesi
export const getFavoriteData = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Favorites.findAll({
      where: { userId }, // 👈 sadece giriş yapmış kullanıcının favorileri
      include: [
        {
          model: product_Market,
          include: [
            {
              model: Products,
              attributes: ["id", "productName", "productImage", "productGr"],
            },
            {
              model: Markets,
              attributes: ["id", "marketName", "marketLocation"],
            },
          ],
        },
      ],
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching favorite data:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFavoriteById = async (req, res) => {
  try {
    const favorite = await favoriteModel.findByPk(req.params.id);

    if (!favorite) {
      return res.status(404).json({ error: "Favori bulunamadı" });
    }

    res.status(200).json({
      success: true,
      message: "Favori bilgisi getirildi",
      favorite,
    });
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
};

export const updateFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, productMarketId } = req.body;

    const favorite = await favoriteModel.findByPk(id);
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    await favorite.update({
      userId,
      productMarketId,
    });
    res.status(200).json({
      success: true,
      message: "Favorite updated successfully",
      favorite,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const favorite = await favoriteModel.findByPk(id);
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }
    await favorite.destroy();
    res.status(200).json({
      message: "Favourite deleted successfully",
      success: "Favourite deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
