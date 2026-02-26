const fs = require("fs/promises");

const getCloudinaryConfig = () => {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const uploadPreset = String(process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();
  return { cloudName, uploadPreset };
};

const isCloudinaryEnabled = () => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  return Boolean(cloudName && uploadPreset);
};

const uploadToCloudinary = async (localFilePath, folder = "snehmilan-connect") => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary config missing");
  }

  const fileBuffer = await fs.readFile(localFilePath);
  const blob = new Blob([fileBuffer]);
  const body = new FormData();
  body.append("file", blob, "upload.jpg");
  body.append("upload_preset", uploadPreset);
  body.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
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
