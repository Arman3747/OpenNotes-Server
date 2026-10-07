import multer from "multer";
import { randomUUID } from "node:crypto";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,

  params: async (_req, file) => {
    const fileName = file.originalname
      .replace(/\.[^.]+$/, "") // Remove the original extension
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    return {
      folder: "openNotes/", // Your Cloudinary folder
      resource_type: "image",
      public_id: `${randomUUID()}-${fileName || "image"}`,
    };
  },
});

export const multerUpload = multer({ storage });
