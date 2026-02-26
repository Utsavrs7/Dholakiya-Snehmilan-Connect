const fs = require("fs/promises");

const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const CLOUDINARY_UPLOAD_PRESET = String(process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();

const isCloudinaryEnabled = () => Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

const uploadToCloudinary = async (localFilePath, folder = "snehmilan-connect") => {
  const fileBuffer = await fs.readFile(localFilePath);
  const blob = new Blob([fileBuffer]);
  const body = new FormData();
  body.append("file", blob, "upload.jpg");
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  body.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const res = await fetch(endpoint, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }
  return data.secure_url;
};

const getUploadedImageUrl = async (file, folder = "snehmilan-connect") => {
  if (!file) return "";
  const localPath = String(file.path || "").trim();
  if (!localPath) return "";

  if (!isCloudinaryEnabled()) {
    return `/uploads/${file.filename}`;
  }

  try {
    return await uploadToCloudinary(localPath, folder);
  } finally {
    // If cloud upload is enabled, local temp file is no longer needed.
    await fs.unlink(localPath).catch(() => {});
  }
};

module.exports = { isCloudinaryEnabled, getUploadedImageUrl };

