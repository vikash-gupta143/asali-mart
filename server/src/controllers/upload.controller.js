import cloudinary from "../config/cloudinary.js";

/**
 * 📤 Upload single image to Cloudinary
 * @route   POST /api/upload
 * @access  Private
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Cloudinary upload (memory buffer se)
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "asalimart/uploads",
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    console.log(`✅ Image uploaded: ${result.secure_url}`);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    next(error);
  }
};

/**
 * 📤 Upload multiple images
 * @route   POST /api/upload/multiple
 * @access  Private
 */
export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "asalimart/uploads",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.secure_url);

    console.log(`✅ ${urls.length} images uploaded`);

    res.status(200).json({
      success: true,
      message: `${urls.length} images uploaded`,
      urls,
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    next(error);
  }
};