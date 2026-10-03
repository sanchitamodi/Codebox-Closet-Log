# Closet Log

Closet Log is a full-stack outfit inspiration board. The React client talks only to the Express REST API; Express uses Supabase PostgreSQL for persistence.

## 1. Create the Supabase table

Create a new Supabase project, open **SQL Editor**, and run [`server/schema.sql`](server/schema.sql). This creates the `outfits` table, a `closet_items` table for uploaded wardrobe pieces, and the `closet-images` Storage bucket. If you set up an earlier version of the project, run the updated SQL file again to add the wardrobe support.

## 2. Configure environment variables

Copy `server/.env.example` to `server/.env` and fill in your Supabase project URL and server-side **secret key**. Do not put these credentials in the React client.

```bash
cp server/.env.example server/.env
```

Optionally copy `client/.env.example` to `client/.env` to point the UI at a different API URL. The default is `http://localhost:4000/api`.

## 3. Install and run

Requires Node.js 18 or newer.

```bash
npm install
npm run install:all
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:4000`.

You can also start the applications separately:

```bash
npm run server
npm run client
```

## API

All request and response bodies are JSON.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/outfits` | List outfits, newest first |
| POST | `/api/outfits` | Create an outfit |
| PUT | `/api/outfits/:id` | Update an outfit |
| DELETE | `/api/outfits/:id` | Delete an outfit |
| GET | `/api/closet-items` | List uploaded wardrobe pieces |
| POST | `/api/closet-items` | Upload one JPG, PNG, WebP, or GIF image (max 5 MB) |
| DELETE | `/api/closet-items/:id` | Delete a wardrobe piece and its stored image |

Create/update accepts `name`, `occasion`, `season`, and optional `imageUrl`. `name`, `occasion`, and `season` are required. For example:

```bash
curl -X POST http://localhost:4000/api/outfits \
  -H 'Content-Type: application/json' \
  -d '{"name":"Beach Bonfire","occasion":"Casual","season":"Fall","imageUrl":"https://images.unsplash.com/photo-1490481651871-ab68de25d43d"}'
```

The server returns JSON errors with appropriate status codes for invalid input, missing records, and database failures.

## Wardrobe photos

Use **My wardrobe** in the app to upload individual clothing or accessory photos. Select one or more pieces, then save an outfit; the card shows those pieces as a mixed-look grid. Photos are stored in the `closet-images` Supabase Storage bucket and use public URLs so the app can display them. Do not upload sensitive photos to this starter app.
