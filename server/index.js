import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { randomUUID } from 'node:crypto';

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))
});
const imageBucket = 'closet-images';

function validateOutfit(body) {
  const errors = {};
  const outfit = {};

  if (body.kind !== undefined && !['inspiration', 'my_outfit'].includes(body.kind)) {
    errors.kind = 'kind must be inspiration or my_outfit.';
  } else {
    outfit.kind = body.kind || 'inspiration';
  }

  for (const field of ['name', 'occasion', 'season']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      errors[field] = `${field} is required.`;
    } else {
      outfit[field] = body[field].trim();
    }
  }

  if (body.imageUrl !== undefined && body.imageUrl !== null && body.imageUrl !== '') {
    if (typeof body.imageUrl !== 'string') {
      errors.imageUrl = 'imageUrl must be a string.';
    } else {
      try {
        new URL(body.imageUrl);
        outfit.imageUrl = body.imageUrl.trim();
      } catch {
        errors.imageUrl = 'imageUrl must be a valid URL.';
      }
    }
  } else {
    outfit.imageUrl = null;
  }

  if (body.itemIds !== undefined) {
    if (!Array.isArray(body.itemIds) || body.itemIds.some((id) => !isValidUuid(id))) {
      errors.itemIds = 'itemIds must be an array of valid closet item IDs.';
    } else {
      outfit.itemIds = [...new Set(body.itemIds)];
    }
  } else {
    outfit.itemIds = [];
  }

  if (body.slots !== undefined && body.slots !== null) {
    const slotNames = ['top', 'bottom', 'shoes', 'accessories'];
    const isValidSlots = typeof body.slots === 'object' && !Array.isArray(body.slots)
      && Object.entries(body.slots).every(([key, id]) => slotNames.includes(key) && (id === null || isValidUuid(id)));
    if (!isValidSlots) {
      errors.slots = 'slots must contain only top, bottom, shoes, or accessories with valid item IDs.';
    } else {
      outfit.slots = Object.fromEntries(slotNames.map((slot) => [slot, body.slots[slot] || null]));
      outfit.itemIds = [...new Set(Object.values(outfit.slots).filter(Boolean))];
    }
  } else {
    outfit.slots = null;
  }

  return { errors, outfit };
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/closet-items', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('closet_items').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

app.post('/api/inspiration-images', upload.single('image'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a JPG, PNG, WebP, or GIF image under 5 MB.' });
  const extension = req.file.mimetype.split('/')[1];
  const storagePath = `inspiration/${randomUUID()}.${extension}`;
  try {
    const { error } = await supabase.storage.from(imageBucket).upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(imageBucket).getPublicUrl(storagePath);
    res.status(201).json({ data: { imageUrl: data.publicUrl } });
  } catch (error) { next(error); }
});

app.post('/api/closet-items', upload.single('image'), async (req, res, next) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'An item name is required.' });
  if (!req.file) return res.status(400).json({ error: 'Choose a JPG, PNG, WebP, or GIF image under 5 MB.' });

  const extension = req.file.mimetype.split('/')[1];
  const storagePath = `${randomUUID()}.${extension}`;
  try {
    const { error: uploadError } = await supabase.storage.from(imageBucket).upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(imageBucket).getPublicUrl(storagePath);
    const { data, error } = await supabase.from('closet_items').insert({ name, imageUrl: urlData.publicUrl, storagePath }).select().single();
    if (error) {
      await supabase.storage.from(imageBucket).remove([storagePath]);
      throw error;
    }
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

app.delete('/api/closet-items/:id', async (req, res, next) => {
  if (!isValidUuid(req.params.id)) return res.status(400).json({ error: 'Invalid closet item ID.' });
  try {
    const { data, error } = await supabase.from('closet_items').delete().eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Closet item not found.' });
    const { error: storageError } = await supabase.storage.from(imageBucket).remove([data.storagePath]);
    if (storageError) console.error('Could not remove image from storage:', storageError.message);
    res.status(204).send();
  } catch (error) { next(error); }
});

app.get('/api/outfits', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('outfits').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post('/api/outfits', async (req, res, next) => {
  const { errors, outfit } = validateOutfit(req.body || {});
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed.', fields: errors });

  try {
    const { data, error } = await supabase.from('outfits').insert(outfit).select().single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

app.put('/api/outfits/:id', async (req, res, next) => {
  if (!isValidUuid(req.params.id)) return res.status(400).json({ error: 'Invalid outfit ID.' });
  const { errors, outfit } = validateOutfit(req.body || {});
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed.', fields: errors });

  try {
    const { data, error } = await supabase.from('outfits').update(outfit).eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Outfit not found.' });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/outfits/:id', async (req, res, next) => {
  if (!isValidUuid(req.params.id)) return res.status(400).json({ error: 'Invalid outfit ID.' });
  try {
    const { data, error } = await supabase.from('outfits').delete().eq('id', req.params.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Outfit not found.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Images must be under 5 MB.' : error.message });
  res.status(500).json({ error: 'Something went wrong while talking to the database.' });
});

app.listen(port, () => console.log(`Closet Log API listening at http://localhost:${port}`));
