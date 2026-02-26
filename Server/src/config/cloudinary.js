const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: String(process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  api_key: String(process.env.API_KEY || process.env.CLOUDINARY_API_KEY || "").trim(),
  api_secret: String(process.env.API_SECRET || process.env.CLOUDINARY_API_SECRET || "").trim(),
});

module.exports = cloudinary;
