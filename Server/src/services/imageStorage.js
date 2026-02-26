const getUploadedImageUrl = async (file, folder = "snehmilan-connect") => {
  if (!file) return "";
  const uploadedUrl = String(file.path || "").trim();
  return uploadedUrl;
};

module.exports = { getUploadedImageUrl };
