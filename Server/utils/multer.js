
// middleware/cloudinaryUpload.js
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from  '../utils/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'SIRE_TECH', // Optional
    resource_type: 'auto', // Allows image, video, pdf
  },
});

const upload = multer({ storage });

export default upload;
