const getUploadedImageUrl = async (file) => {
  if (!file) return "";
  return `/uploads/${file.filename}`;
};

module.exports = { getUploadedImageUrl };
