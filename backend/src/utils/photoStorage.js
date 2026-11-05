const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Saves a base64 image string (data:image/jpeg;base64,...) to disk
 * @param {string} base64Data
 * @param {string} prefix ('clockin' | 'clockout' | 'profile')
 * @returns {string} public relative path e.g. '/uploads/clockin-123.jpg'
 */
const saveBase64Image = (base64Data, prefix = 'photo') => {
  if (!base64Data || typeof base64Data !== 'string') return null;

  // Check if it's a data URL
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    // If it's already a URL/path, keep it
    if (base64Data.startsWith('http') || base64Data.startsWith('/uploads')) {
      return base64Data;
    }
    return null;
  }

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${filename}`;
};

module.exports = { saveBase64Image, uploadDir };

