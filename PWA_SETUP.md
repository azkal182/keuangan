# PWA Setup Instructions

Implementasi PWA mengikuti dokumentasi resmi: https://vite-pwa-org.netlify.app/guide/

## Instalasi

Jalankan perintah berikut untuk menginstall vite-plugin-pwa:

```bash
npm install -D vite-plugin-pwa
```

## Icons yang Diperlukan

Buat atau tambahkan icon PWA berikut di folder `public/`:

1. **pwa-192x192.png** - Icon 192x192 pixels
2. **pwa-512x512.png** - Icon 512x512 pixels
3. **apple-touch-icon.png** - Icon 180x180 pixels untuk iOS
4. **favicon.ico** - Favicon standar

Anda bisa menggunakan tool online seperti:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Testing PWA

1. Build aplikasi:
```bash
npm run build
```

2. Preview build:
```bash
npm run preview
```

3. Buka di browser dan:
   - Chrome: Buka DevTools > Application > Service Workers
   - Cek "Add to Home Screen" tersedia
   - Test offline functionality

## Fitur PWA yang Sudah Dikonfigurasi

✅ Service Worker dengan auto-update
✅ Manifest.json
✅ Offline caching
✅ Supabase API caching (NetworkFirst strategy)
✅ Apple Touch Icons
✅ Theme color dan meta tags

## Catatan

- PWA akan aktif otomatis setelah build production
- Di development mode, PWA juga aktif (devOptions.enabled: true)
- Service Worker akan update otomatis ketika ada perubahan
