import productmarketModel from "../models/productmarketModels.js";
import cartModel from "../models/cartModels.js";
import favoriteModel from "../models/favoriteModels.js";
import { sequelize } from "../config/db.js";
import Markets from "../models/marketModels.js";
import Products from "../models/productModels.js";
import { Op } from "sequelize";
import Categories from "../models/categoryModels.js";
import Brands from "../models/brandModels.js";

export const add_productMarket = async (req, res) => {
  try {
    const {
      productId,
      marketId,
      regularPrice,
      discountPrice,
      discountRate,
      stockAmount,
      startDate,
      endDate,
    } = req.body;

    // Zorunlu alanların kontrolü
    if (!productId || !marketId || !regularPrice || !stockAmount) {
      return res.status(400).send({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Ürün ve market bilgilerini veritabanına ekleyin
    const productMarket = await productmarketModel.create({
      productId,
      marketId,
      regularPrice,
      discountPrice: discountPrice || null, // discountPrice opsiyonel, girilmediyse null olacak
      discountRate: discountRate || null, // discountRate opsiyonel, girilmediyse null olacak
      stockAmount,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    // Ürün ve Market bilgilerini ilişkili olarak dahil etmek için include kullanıyoruz.
    const productMarketWithDetails = await productmarketModel.findOne({
      where: { id: productMarket.id },
      include: [
        {
          model: Products,
          attributes: ["id", "productName", "productGr", "productImage"],
        },
        {
          model: Markets,
          attributes: ["id", "marketName"],
        },
      ],
    });

    res.status(201).send({
      success: true,
      message: "Product market added successfully",
      productMarket: productMarketWithDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in product market API",
      error: error.message,
    });
  }
};

export const get_productMarket = async (req, res) => {
  try {
    const { search } = req.query;

    const productNameFilter = search
      ? {
          productName: {
            [Op.like]: `%${search}%`, // MySQL'de LIKE, case-sensitive olabilir
          },
        }
      : {};

    const productMarket = await productmarketModel.findAll({
      include: [
        {
          model: Products,
          where: productNameFilter,
          attributes: [
            "id",
            "productName",
            "productImage",
            "productGr",
            "productContents",
            "categoryId",
            "brandId",
            "createdAt",
            "updatedAt",
          ],
          include: [
            {
              model: Categories,
              attributes: ["id", "categoryName", "categoryImage"],
            },
            {
              model: Brands,
              attributes: ["id", "brandName", "brandImage"],
            },
          ],
        },
        {
          model: Markets,
          attributes: ["id", "marketName"],
        },
      ],
    });

    res.status(200).json(productMarket);
  } catch (error) {
    console.error("Ürün-market verisi alınamadı:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

export const getProductMarketBySearch = async (req, res) => {
  try {
    const { search } = req.query;

    const productNameFilter = search
      ? {
          productName: {
            [Op.like]: `%${search}%`, // MySQL'de LIKE, case-sensitive olabilir
          },
        }
      : {};

    const productMarket = await productmarketModel.findAll({
      include: [
        {
          model: Products,
          where: productNameFilter,
          attributes: [
            "id",
            "productName",
            "productImage",
            "productGr",
            "productContents",
            "categoryId",
            "brandId",
            "createdAt",
            "updatedAt",
          ],
          include: [
            {
              model: Categories,
              attributes: ["id", "categoryName", "categoryImage"],
            },
            {
              model: Brands,
              attributes: ["id", "brandName", "brandImage"],
            },
          ],
        },
        {
          model: Markets,
          attributes: ["id", "marketName"],
        },
      ],
    });

    res.status(200).json({ products: productMarket });
  } catch (error) {
    console.error("Ürün-market verisi alınamadı:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

export const get_productMarketById = async (req, res) => {
  try {
    const productMarket = await productmarketModel.findByPk(req.params.id);

    if (!productMarket) {
      return res.status(404).json({ error: "id bulunamadı" });
    }

    res.status(200).json({
      success: true,
      message: "product market bilgisi getirildi",
      productMarket,
    });
  } catch (error) {
    console.error("Veri çekme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
};

export const getAdminMarketProductsNew = async (req, res) => {
  try {
    const adminId = req.admin.id; // Admin ID parametre olarak alınıyor

    // Adminin sahip olduğu marketler
    const markets = await Markets.findAll({
      where: { adminId }, // Admin ID'ye göre marketleri filtrele
    });

    if (markets.length === 0) {
      return res
        .status(404)
        .json({ error: "Adminin sahip olduğu market bulunamadı" });
    }

    // Adminin sahip olduğu marketlerdeki ürünleri ve fiyat bilgilerini almak
    const productMarkets = await productmarketModel.findAll({
      where: {
        marketId: {
          [Op.in]: markets.map((market) => market.id), // Adminin sahip olduğu marketler
        },
      },
      include: [
        {
          model: Products,
          attributes: [
            "id", // Product ID'yi de dahil et
            "productName",
            "productGr",
            "productContents",
            "productImage",
          ], // Ürün bilgilerini al
        },
        {
          model: Markets,
          attributes: ["marketName", "marketLocation"], // Market bilgilerini al
        },
      ],
    });

    if (productMarkets.length === 0) {
      return res
        .status(404)
        .json({ error: "Adminin sahip olduğu marketlerde ürün bulunamadı" });
    }

    // Ürünlerin listesi
    const productList = productMarkets.map((pm) => ({
      id: pm.Product.id, // Ürün ID'si
      productName: pm.Product.productName,
      productGr: pm.Product.productGr,
      productContents: pm.Product.productContents,
      productImage: pm.Product.productImage,
      marketName: pm.Market.marketName,
      marketLocation: pm.Market.marketLocation,
      regularPrice: pm.regularPrice,
      discountPrice: pm.discountPrice,
      stockAmount: pm.stockAmount,
      startDate: pm.startDate,
      endDate: pm.endDate,
    }));

    // Ürünleri döndür
    res.status(200).json(productList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

export const update_productMarket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId,
      marketId,
      regularPrice,
      stockAmount,
      discountPrice,
      discountRate,
      startDate,
      endDate,
    } = req.body;

    // Zorunlu alanlar kontrolü
    if (
      productId === undefined ||
      marketId === undefined ||
      regularPrice === undefined ||
      stockAmount === undefined
    ) {
      return res.status(400).json({
        message:
          "productId, marketId, regularPrice ve stockAmount alanları zorunludur",
      });
    }

    const productMarket = await productmarketModel.findByPk(id);
    if (!productMarket) {
      return res.status(404).json({ message: "Product market not found" });
    }

    // Güncellenecek veriler
    const updateData = {
      productId,
      marketId,
      regularPrice,
      stockAmount,
      discountPrice: "discountPrice" in req.body ? discountPrice : null,
      discountRate: "discountRate" in req.body ? discountRate : null,
      startDate: "startDate" in req.body ? startDate : null,
      endDate: "endDate" in req.body ? endDate : null,
    };

    await productMarket.update(updateData);

    res.status(200).json({
      success: true,
      message: "Product market updated successfully",
      productMarket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const delete_productMarket = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const productMarket = await productmarketModel.findByPk(id);
    if (!productMarket) {
      return res.status(404).json({ message: "Product market not found" });
    }

    await favoriteModel.destroy({
      where: { productMarketId: id },
      transaction,
    });

    await cartModel.destroy({
      where: { productMarketId: id },
      transaction,
    });

    await productMarket.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({ message: "Product market deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// export const getMarketsByProductId = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const productMarkets = await productmarketModel.findAll({
//       where: { productId: id },
//       include: [
//         {
//           model: Markets,
//           attributes: ["id", "marketName"],
//         },
//       ],
//     });

//     if (!productMarkets || productMarkets.length === 0) {
//       return res.status(404).send({
//         success: false,
//         message: "No markets found for this product",
//       });
//     }

//     res.status(200).send({
//       success: true,
//       message: "Markets for the product fetched successfully",
//       data: productMarkets,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in fetching product markets",
//       error: error.message,
//     });
//   }
// };
//çıktılarken bu kullanılacak mobilde
export const getProductMarketData = async (req, res) => {
  try {
    const productMarkets = await productmarketModel.findAll({
      include: [
        {
          model: Products,
          attributes: ["id", "productName", "productImage", "productGr"],
        },

        {
          model: Markets,
          attributes: ["id", "marketName"],
        },
      ],
    });

    if (!productMarkets) {
      return res.status(404).json({
        success: false,
        message: "Bulunamadı.",
      });
    }

    res.status(200).json({
      success: true,
      data: productMarkets,
    });
  } catch (error) {
    console.error("❌ Hata:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    });
  }
};

export const getFilteredProducts = async (req, res) => {
  try {
    const { categoryId, brandId } = req.query;

    const productWhere = {};
    if (categoryId) productWhere.categoryId = categoryId;
    if (brandId) productWhere.brandId = brandId;

    const productsInMarkets = await productmarketModel.findAll({
      include: [
        {
          model: Products,
          where: productWhere,
          include: [{ model: Categories }, { model: Brands }],
        },
        {
          model: Markets,
        },
      ],
    });

    res.status(200).json(productsInMarkets);
  } catch (error) {
    console.error("Filtreli ürünleri getirirken hata:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

export const getAdminMarketProducts = async (req, res) => {
  try {
    const { id } = req.params; // Admin ID parametre olarak alınıyor

    // Adminin sahip olduğu marketler
    const markets = await Markets.findAll({
      where: { adminId: id }, // Admin ID'ye göre marketleri filtrele
    });

    if (markets.length === 0) {
      return res
        .status(404)
        .json({ error: "Adminin sahip olduğu market bulunamadı" });
    }

    // Adminin sahip olduğu marketlerdeki ürünleri ve fiyat bilgilerini almak
    const productMarkets = await productmarketModel.findAll({
      where: {
        marketId: {
          [Op.in]: markets.map((market) => market.id), // Adminin sahip olduğu marketler
        },
      },
      include: [
        {
          model: Products,
          attributes: [
            "id",
            "productName", // Ürün adı
            "productGr", // Ürün gramajı
            "productContents", // Ürün içeriği
            "productImage", // Ürün görseli
          ], // Ürün bilgilerini al
        },
        {
          model: Markets,
          attributes: ["id", "marketName", "marketLocation"], // Market bilgilerini al
        },
      ],
    });

    if (productMarkets.length === 0) {
      return res
        .status(404)
        .json({ error: "Adminin sahip olduğu marketlerde ürün bulunamadı" });
    }

    // Ürünlerin listesi
    const productList = productMarkets.map((pm) => ({
      id: pm.id, // Ürün market ID'si
      Product: {
        productId: pm.Product?.id,
        productName: pm.Product?.productName,
        productGr: pm.Product?.productGr,
        productContents: pm.Product?.productContents,
        productImage: pm.Product?.productImage
          ? {
              url: pm.Product?.productImage.url, // Ürün resmi URL'si
              public_id: pm.Product?.productImage.public_id, // Ürün resmi public_id'si
            }
          : null,
      },
      Market: {
        marketId: pm.Market?.id,
        marketName: pm.Market?.marketName,
        marketLocation: pm.Market?.marketLocation,
      },
      regularPrice: pm.regularPrice,
      discountPrice: pm.discountPrice,
      discountRate: pm.discountRate,
      stockAmount: pm.stockAmount,
      startDate: pm.startDate,
      endDate: pm.endDate,
    }));

    // Ürünleri döndür
    console.log(productList);
    res.status(200).json(productList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { brandId } = req.query;

  try {
    // 1. Önce sadece kategoriye göre ürünleri al
    const allCategoryProducts = await productmarketModel.findAll({
      include: [
        {
          model: Products,
          where: { categoryId },
          include: [
            { model: Brands, attributes: ["id", "brandName", "brandImage"] },
            {
              model: Categories,
              attributes: ["id", "categoryName", "categoryImage"],
            },
          ],
        },
        {
          model: Markets,
          attributes: ["id", "marketName"],
        },
      ],
    });

    // 2. Bu ürünlerden tüm benzersiz markaları çıkar
    const brandIds = [
      ...new Set(allCategoryProducts.map((item) => item.Product.brandId)),
    ];

    const uniqueBrands = await Brands.findAll({
      where: { id: brandIds },
      attributes: ["id", "brandName", "brandImage"],
    });

    // 3. Eğer brandId seçilmişse, sadece o markanın ürünlerini getir
    let filteredProducts = allCategoryProducts;
    if (brandId) {
      filteredProducts = allCategoryProducts.filter(
        (item) => item.Product.brandId.toString() === brandId.toString()
      );
    }

    return res.status(200).json({
      products: filteredProducts,
      brands: uniqueBrands,
    });
  } catch (error) {
    console.error("Kategoriye göre ürün ve markalar getirilemedi:", error);
    return res.status(500).json({ message: "Hata oluştu" });
  }
};

// Stoğu 10 dan az kalan ürünleri listelemek için
export const getLowStockProducts = async (req, res) => {
  try {
    const lowStockProducts = await productmarketModel.findAll({
      where: {
        stockAmount: { [Op.lt]: 10 },
      },
      include: [
        {
          model: Products,
          attributes: [
            "id",
            "productName",
            "productImage",
            "productGr",
            "productContents",
            "categoryId",
            "brandId",
            "createdAt",
            "updatedAt",
          ],
          include: [
            { model: Categories, attributes: ["id", "categoryName"] },
            { model: Brands, attributes: ["id", "brandName"] },
          ],
        },
        { model: Markets, attributes: ["id", "marketName"] },
      ],
    });

    res.status(200).json({ products: lowStockProducts });
  } catch (error) {
    console.error("Stok az kalan ürünler alınamadı:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// İndirimde olan ürünleri listelemek için
export const getDiscountedProducts = async (req, res) => {
  try {
    const discountedProducts = await productmarketModel.findAll({
      where: {
        discountPrice: { [Op.ne]: null },
      },
      include: [
        {
          model: Products,
          attributes: [
            "id",
            "productName",
            "productImage",
            "productGr",
            "productContents",
            "categoryId",
            "brandId",
            "createdAt",
            "updatedAt",
          ],
          include: [
            { model: Categories, attributes: ["id", "categoryName"] },
            { model: Brands, attributes: ["id", "brandName"] },
          ],
        },
        { model: Markets, attributes: ["id", "marketName"] },
      ],
    });

    res.status(200).json({ products: discountedProducts });
  } catch (error) {
    console.error("İndirimli ürünler alınamadı:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
