import Cart from "../models/cartModels.js";
import Products from "../models/productModels.js";
import product_Market from "../models/productmarketModels.js";
import Markets from "../models/marketModels.js";
import User from "../models/userModels.js";

export const addCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productMarketId, quantity } = req.body;

    if (!productMarketId || !quantity) {
      return res.status(400).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    // Aynı kullanıcı aynı productMarketId ile daha önce ürün eklediyse
    const existingCartItem = await Cart.findOne({
      where: {
        userId,
        productMarketId,
      },
    });

    if (existingCartItem) {
      // Eğer aynı ürün ve market zaten sepette varsa, miktarı güncelle
      existingCartItem.quantity += Number(quantity);
      await existingCartItem.save();

      return res.status(200).send({
        success: true,
        message: "Cart updated",
        cart: existingCartItem,
      });
    }

    // Eğer yoksa yeni kayıt oluştur
    const cart = await Cart.create({
      userId,
      productMarketId,
      quantity,
    });

    res.status(201).send({
      success: true,
      message: "Cart added",
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const carts = await Cart.findAll();
    // const { userId } = req.params;
    // const carts = await Cart.findAll({ where: { userId } });
    res.status(200).json(carts);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getCartById = async (req, res) => {
  try {
    const cart = await Cart.findByPk(req.params.id);

    if (!cart) {
      return res.status(404).json({ error: "Kart bulunamadı" });
    }

    res.status(200).json({
      success: true,
      message: "Kart bilgisi getirildi",
      cart,
    });
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
};

// Giriş yapmış kullanıcının fav listesi
export const getCartData = async (req, res) => {
  try {
    const userId = req.user.id;

    const carts = await Cart.findAll({
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

    res.status(200).json(carts);
  } catch (error) {
    console.error("Error fetching favorite data:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, productMarketId, quantity } = req.body;

    const cart = await Cart.findByPk(id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    await cart.update({
      userId,
      productMarketId,
      quantity,
    });

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCart = async (req, res) => {
  try {
    const { id } = req.params;

    const cart = await Cart.findByPk(id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    await cart.destroy();

    res.status(200).json({
      message: "Cart deleted successfully",
      success: "Cart deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Tüm cartları getiren fonksiyon
export const getCartDataAdmin = async (req, res) => {
  try {
    const cartItems = await Cart.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "surname", "email"],
        },
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

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const grouped = {};

    cartItems.forEach((item) => {
      const user = item.User;
      const userId = user.id;

      if (!grouped[userId]) {
        grouped[userId] = {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          items: [],
        };
      }

      const existingIndex = grouped[userId].items.findIndex(
        (i) => i.productMarketId === item.productMarketId
      );

      if (existingIndex !== -1) {
        // Eğer ürün zaten varsa quantity'yi topla
        grouped[userId].items[existingIndex].quantity = (
          parseInt(grouped[userId].items[existingIndex].quantity) +
          parseInt(item.quantity)
        ).toString();

        // updatedAt değerini en yenisiyle güncelle
        grouped[userId].items[existingIndex].updatedAt =
          new Date(item.updatedAt) >
          new Date(grouped[userId].items[existingIndex].updatedAt)
            ? item.updatedAt
            : grouped[userId].items[existingIndex].updatedAt;
      } else {
        // Yoksa doğrudan ekle
        grouped[userId].items.push({
          quantity: item.quantity,
          updatedAt: item.updatedAt,
          productMarketId: item.productMarketId,
          product_Market: item.product_Market,
        });
      }
    });

    const result = Object.values(grouped);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching cart data:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
