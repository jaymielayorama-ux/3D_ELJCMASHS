const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

function loadEnvFromFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim();
    process.env[key.trim()] = value.replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFromFile();

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const uploadsDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'data.json');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jaymielayorama@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const likedBy = new Map();

app.get('/api/get-uploaded-images', async (req, res) => {
  try {
    // Hihilingin natin kay Cloudinary ang mga files
    const result = await cloudinary.search
      .expression('resource_type:image') // Lahat ng klase ng images
      // KUNG MAY SPECIFIC FOLDER KA, gamitin mo ito: .expression('folder:iyong_folder_name')
      .sort_by('created_at', 'desc') // Pinakabagong upload ang mauuna
      .max_results(50) // Limitahan natin sa 50 images muna para mabilis
      .execute();

    // Kukunin lang natin ang mga 'secure_url' mula sa bawat image na nahanap
    const images = result.resources.map(file => ({
      url: file.secure_url,
      public_id: file.public_id,
      created_at: file.created_at
    }));

    // Ipadala ang listahan ng images sa frontend
    res.status(200).json({ success: true, data: images });

  } catch (error) {
    console.error("Cloudinary fetch error:", error);
    res.status(500).json({ success: false, message: "Hindi makuha ang images mula sa Cloudinary" });
  }
}); 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

app.set('trust proxy', true);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({ works: [] }, null, 2));
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.use(express.static(__dirname));

function readData() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function sanitizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
      const shortsId = parsed.pathname.match(/\/shorts\/([^/?]+)/i);
      if (shortsId && shortsId[1]) return shortsId[1];
      const embedId = parsed.pathname.match(/\/embed\/([^/?]+)/i);
      if (embedId && embedId[1]) return embedId[1];
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function buildThumbnailFromUrl(url) {
  if (!url) return '';
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  }

  return '';
}

async function uploadToCloudinary(file) {
  if (!file || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'auto',
      folder: 'elj-student-works'
    });

    return result.secure_url || result.url || null;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return null;
  }
}

async function sendApprovalEmail(submission) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY missing. Email not sent.');
    return;
  }

  const approveBaseUrl = `${PUBLIC_BASE_URL}/api/approve-work`;
  const rejectBaseUrl = `${PUBLIC_BASE_URL}/api/reject-work`;
  const approveLink = `${approveBaseUrl}?id=${encodeURIComponent(submission.id)}`;
  const rejectLink = `${rejectBaseUrl}?id=${encodeURIComponent(submission.id)}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `ELJ Student Works <${RESEND_FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject: `ELJ Student Works: ${submission.title} needs review`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171718; max-width: 680px; margin: 0 auto;">
            <div style="padding: 24px 28px; border: 1px solid #e5e7eb; border-radius: 18px; background: #fffdf9;">
              <h2 style="margin: 0 0 16px; font-size: 26px; color: #171718;">New student work submitted</h2>
              <p style="margin: 0 0 14px; color: #586571;">A new student submission is waiting for review before it is published on the ELJ website.</p>
              <p><strong>Student:</strong> ${submission.name}</p>
              <p><strong>Email:</strong> ${submission.email}</p>
              <p><strong>Title:</strong> ${submission.title}</p>
              <p><strong>Category:</strong> ${submission.category}</p>
              <p><strong>Description:</strong> ${submission.description}</p>
              <p><strong>File:</strong> <a href="${PUBLIC_BASE_URL}${submission.fileUrl}" style="color:#1d5fb9;">${submission.fileName}</a></p>
              <div style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                <a href="${approveLink}" style="display:inline-block; background:#1f9d68; color:#fff; padding:12px 18px; border-radius:8px; text-decoration:none; font-weight:700;">Approve submission</a>
                <a href="${rejectLink}" style="display:inline-block; background:#d7282f; color:#fff; padding:12px 18px; border-radius:8px; text-decoration:none; font-weight:700;">Reject submission</a>
              </div>
            </div>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend email failed:', errorText);
      return;
    }

    console.log('Approval email sent to', ADMIN_EMAIL);
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }
}

app.get('/api/works', (req, res) => {
  const data = readData();
  const approved = data.works
    .filter((item) => item.status === 'approved')
    .map((item) => ({
      ...item,
      likes: Number(item.likes || 0)
    }));

  res.json(approved);
});

app.post('/api/like-work', (req, res) => {
  const { id, clientId } = req.body || {};

  if (!id) {
    return res.status(400).json({ message: 'Submission ID is required.' });
  }

  if (!clientId) {
    return res.status(400).json({ message: 'Client identifier is required.' });
  }

  const data = readData();
  const item = data.works.find((entry) => entry.id === String(id));

  if (!item) {
    return res.status(404).json({ message: 'Submission not found.' });
  }

  const key = `${id}:${String(clientId)}`;
  if (likedBy.has(key)) {
    return res.json({ message: 'Already liked.', likes: Number(item.likes || 0), alreadyLiked: true });
  }

  likedBy.set(key, true);
  item.likes = Number(item.likes || 0) + 1;
  writeData(data);

  res.json({ message: 'Liked successfully.', likes: item.likes, alreadyLiked: false });
});

app.post('/api/submit-work', upload.single('file'), async (req, res) => {
  const data = readData();
  const file = req.file;
  const body = req.body;

  const email = sanitizeEmail(body.email);
  const name = String(body.name || '').trim();
  const title = String(body.title || '').trim();
  const category = String(body.category || '').trim();
  const description = String(body.description || '').trim();
  const mediaType = String(body.mediaType || 'upload').trim();
  const videoUrl = String(body.videoUrl || '').trim();

  if (!email || !name || !title || !category || !description) {
    return res.status(400).json({ message: 'Please complete all required fields.' });
  }

  let finalFileUrl = '';
  let finalThumbnailUrl = '';
  let finalFileName = '';

  if (mediaType === 'youtube' || mediaType === 'link') {
    if (!videoUrl) {
      return res.status(400).json({ message: 'Please provide a video link or YouTube URL.' });
    }

    finalFileUrl = videoUrl;
    finalThumbnailUrl = buildThumbnailFromUrl(videoUrl);
    finalFileName = title;
  } else {
    const uploadedUrl = file ? await uploadToCloudinary(file) : null;

    if (!file && !uploadedUrl) {
      return res.status(400).json({ message: 'Please upload a file or provide a video link.' });
    }

    finalFileUrl = uploadedUrl || `/uploads/${file.filename}`;
    finalThumbnailUrl = finalFileUrl;
    finalFileName = file ? file.originalname : title;
  }

  const submission = {
    id: String(Date.now()),
    name,
    email,
    title,
    category,
    description,
    fileName: finalFileName,
    fileUrl: finalFileUrl,
    thumbnailUrl: finalThumbnailUrl,
    mediaType,
    createdAt: new Date().toISOString(),
    status: 'pending',
    approvedBy: null,
    adminNote: '',
    likes: 0
  };

  data.works.unshift(submission);
  writeData(data);

  sendApprovalEmail(submission);

  res.json({
    message: 'Your submission has been sent for approval. An approval email has also been sent to the administrator.',
    id: submission.id
  });
});

app.get('/api/pending', (req, res) => {
  const data = readData();
  const pending = data.works.filter((item) => item.status === 'pending');
  res.json(pending);
});

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', baseUrl: PUBLIC_BASE_URL });
});

function updateApprovalState(id, status, note) {
  const data = readData();
  const item = data.works.find((entry) => entry.id === String(id));

  if (!item) {
    return { found: false };
  }

  item.status = status;
  item.adminNote = note;
  if (status === 'approved') {
    item.approvedBy = 'admin';
  }
  writeData(data);

  return { found: true, item };
}

app.get('/api/approve-work', (req, res) => {
  const { id } = req.query || {};

  if (!id) {
    return res.status(400).send('Submission ID is required.');
  }

  const result = updateApprovalState(id, 'approved', 'Approved from email link');
  if (!result.found) {
    return res.status(404).send('Submission not found.');
  }

  res.send('<html><body style="font-family:Arial,sans-serif;padding:40px;text-align:center;"><h2>Submission approved.</h2><p>The work has been published to the website.</p></body></html>');
});

app.post('/api/approve-work', (req, res) => {
  const { id, approvedBy = 'admin' } = req.body || {};

  if (!id) {
    return res.status(400).json({ message: 'Submission ID is required.' });
  }

  const data = readData();
  const item = data.works.find((entry) => entry.id === String(id));

  if (!item) {
    return res.status(404).json({ message: 'Submission not found.' });
  }

  item.status = 'approved';
  item.approvedBy = approvedBy;
  item.adminNote = item.adminNote || 'Approved for website display';
  writeData(data);

  res.json({ message: 'Submission approved and published to the website.' });
});

app.get('/api/reject-work', (req, res) => {
  const { id } = req.query || {};

  if (!id) {
    return res.status(400).send('Submission ID is required.');
  }

  const result = updateApprovalState(id, 'rejected', 'Rejected from email link');
  if (!result.found) {
    return res.status(404).send('Submission not found.');
  }

  res.send('<html><body style="font-family:Arial,sans-serif;padding:40px;text-align:center;"><h2>Submission rejected.</h2><p>The work will not be shown on the website.</p></body></html>');
});

app.post('/api/reject-work', (req, res) => {
  const { id, note = 'Rejected by admin.' } = req.body || {};

  if (!id) {
    return res.status(400).json({ message: 'Submission ID is required.' });
  }

  const data = readData();
  const item = data.works.find((entry) => entry.id === String(id));

  if (!item) {
    return res.status(404).json({ message: 'Submission not found.' });
  }

  item.status = 'rejected';
  item.adminNote = note;
  writeData(data);

  res.json({ message: 'Submission rejected.' });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/student-works', (req, res) => {
  res.sendFile(path.join(__dirname, 'student-works.html'));
});

app.get('/upload-work', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload-work.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
