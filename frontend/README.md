# LMS Frontend

Frontend aplikasi LMS menggunakan Next.js dengan Edge Runtime untuk deployment di Cloudflare Pages.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Run development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 📁 Struktur Folder

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities dan helpers
├── public/               # Static assets
├── package.json
├── next.config.mjs       # Next.js configuration
├── tailwind.config.ts    # TailwindCSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL Backend API | `http://localhost:5000/api` |

## 🏗️ Build & Deploy

### Build untuk Production

```bash
npm run build
```

### Deploy ke Cloudflare Pages

1. Connect repository ke Cloudflare Pages
2. Set build settings:
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Node.js version: `20`
3. Set environment variables di Cloudflare dashboard
4. Deploy

## 🔐 Authentication

Frontend menggunakan JWT token yang disimpan di `localStorage`:

- Token disimpan setelah login berhasil
- Setiap request ke backend menyertakan header `Authorization: Bearer <token>`
- Token otomatis dihapus jika expired (401 response)

## 📦 Dependencies Utama

- **Next.js** - React framework
- **TailwindCSS** - Styling
- **SWR** - Data fetching
- **Radix UI** - UI components
- **Phosphor Icons** - Icons
- **date-fns** - Date utilities
