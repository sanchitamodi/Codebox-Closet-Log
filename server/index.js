import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

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

function validateOutfit(body) {
  const errors = {};
  const outfit = {};

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

  return { errors, outfit };
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

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
  res.status(500).json({ error: 'Something went wrong while talking to the database.' });
});

app.listen(port, () => console.log(`Closet Log API listening at http://localhost:${port}`));
