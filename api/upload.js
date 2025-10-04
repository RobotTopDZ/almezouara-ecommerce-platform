const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../images/variants');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Upload single image
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Create relative URL for the image
    const imageUrl = `/images/variants/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload image' 
    });
  }
});

// Delete image
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (fs.existsSync(filepath)) {
      // Delete file
      fs.unlinkSync(filepath);
      res.json({ 
        success: true, 
        message: 'Image deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Image not found' 
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete image' 
    });
  }
});

module.exports = router;