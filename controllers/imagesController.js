import axios from "axios";
import cloudinary from "cloudinary";
import images from "../models/imagesModel.js";
import multer from "multer";
import jwt from "jsonwebtoken";
import User from "../models/userModels.js";
import Products from "../models/productModels.js";
import product_Market from "../models/productmarketModels.js";
import Market from "../models/marketModels.js";
import Categories from "../models/categoryModels.js";
import Brands from "../models/brandModels.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("productImage"); // input name: productImage

export const uploadProductImage = (req, res) => {
  console.log("aa");
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  console.log(token);

  if (!token) {
    return res.status(401).json({ message: "Token bulunamadı." });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Geçersiz token." });
    }

    req.user = await User.findByPk(decoded.id);

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          message: "Fotoğraf yüklenirken bir hata oluştu",
          error: err,
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Dosya yüklenmedi" });
      }

      try {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { resource_type: "image", folder: "product_images" },
          async (error, result) => {
            if (error) {
              return res
                .status(500)
                .json({ message: "Cloudinary yükleme hatası", error });
            }

            const { public_id, url } = result;

            try {
              // PYTHON API'ye istek
              const response = await axios.post(
                "http://127.0.0.1:5000/detect",
                {
                  image_url: url,
                  user: {
                    id: req.user.id,
                  },
                }
              );

              const detectionResult = response.data;
              const detectedLabel =
                detectionResult.objects.length > 0
                  ? detectionResult.objects[0].label
                  : null;

              // Yeni resim ve etiketi kaydet
              const newProductImage = await images.create({
                productImage: { public_id, url },
                productMatch: detectedLabel || "No match",
                uploadedBy: req.user.id,
              });

              // EŞLEŞME: Etikete uygun productName var mı?
              let matchedProduct = null;
              if (detectedLabel) {
                matchedProduct = await Products.findOne({
                  where: {
                    productName: detectedLabel,
                  },
                });
              }

              if (!matchedProduct) {
                return res.status(200).json({
                  message:
                    "Etiket bulundu fakat veritabanında eşleşen bir ürün bulunamadı.",
                  data: newProductImage,
                  detectionResult: detectionResult,
                  markets: [],
                });
              }

              // Ürün id'si ile marketlerdeki bilgileri çek
              const marketResults = await product_Market.findAll({
                where: {
                  productId: matchedProduct.id,
                },
                include: [
                  {
                    model: Market,
                    attributes: ["id", "marketName"],
                  },
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
                ],
              });

              res.status(201).json({
                message:
                  "Fotoğraf yüklendi, analiz edildi ve marketler bulundu.",
                data: newProductImage,
                matchedProduct: {
                  id: matchedProduct.id,
                  name: matchedProduct.productName,
                },
                products: marketResults,
                detectionResult: detectionResult,
              });
            } catch (error) {
              console.error("Python API veya DB hatası:", error);
              return res.status(500).json({
                message:
                  "Python API ya da veritabanı işlemlerinde hata oluştu.",
                error: error.message,
              });
            }
          }
        );

        uploadStream.end(req.file.buffer);
      } catch (error) {
        console.error("Genel hata:", error);
        res.status(500).json({
          message: "Fotoğraf yükleme sırasında bir hata oluştu",
          error,
        });
      }
    });
  });
};

export const getLatestImage = async (req, res) => {
  try {
    const userId = req.user.id; // JWT veya session'dan gelen kullanıcı kimliği

    const image = await images.findOne({
      where: { uploadedBy: userId },
      order: [["createdAt", "DESC"]],
    });

    if (!image) {
      return res.status(404).json({ message: "Görsel bulunamadı" });
    }

    res.status(200).json({
      imageId: image.id,
      imageUrl: image.productImage.url,
      userId: userId,
    });
  } catch (error) {
    console.error("Hata:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
