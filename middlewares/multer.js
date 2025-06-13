import multer from "multer";

const storage = multer.memoryStorage();

export const singleUpload = multer({ storage }).single("file");

export const singleBrandUpload = multer({ storage }).single("brandImage");

export const singleAdminUpload = multer({ storage }).single("profilePic");

export const singleMarketUpload = multer({ storage }).single("marketImage");

export const singleCategoryUpload = multer({ storage }).single("categoryImage");

export const singleProductUpload = multer({ storage }).single("productImage");

/*export const singleProductUploadWithLogging = (req, res, next) => {
  console.log("Multer middleware: ", req.file); // req.file'ı kontrol et
  next();
};*/
