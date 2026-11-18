# Güçlenme Planım – PWA Antrenman Takip

Her gün aynı antrenman akışı: **Şınav → Mekik → Barfiks → 3000 m koşu**

## Özellikler
- Set başlat / bitir + otomatik dinlenme sayacı (varsayılan 60 sn)
- Günlük antrenman set kayıtları
- Tek seferlik **Max Test** kayıtları
- 4 ayrı ilerleme grafiği
- GPS ile 3000 m koşu takibi (mesafe, kalan, süre, tempo)
- Koşu bitince **GPX** indirme
- Offline çalışır (PWA)
- Veriler tarayıcıda saklanır

## Hedefler
| Hareket       | Başlangıç | Hedef  |
|---------------|-----------|--------|
| Şınav         | 15        | 30     |
| Mekik         | 15        | 35     |
| Barfiks       | 0         | 6      |
| 3000 m koşu   | 18:00     | 14:50  |

## Kurulum (GitHub Pages)

1. Bu klasördeki tüm dosyaları bir GitHub deposuna yükle (örnek depo adı: `guclenme-programim`).
2. Repo → **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` / folder: `/ (root)`
5. Kaydet. Birkaç dakika içinde `https://KULLANICIADI.github.io/guclenme-programim` adresinde açılır.
6. Telefonda Chrome ile aç → menüden **Ana ekrana ekle**.

## Yerel test
Basit bir HTTP sunucusu ile aç (file:// ile GPS ve service worker çalışmaz):

```bash
npx serve .
# veya
python3 -m http.server 8000
```

## Notlar
- Barfiks için bar gerekir. Yoksa asılı kalma veya negatif barfiks yap.
- GPS için konum izni ver. HTTPS gerekir (GitHub Pages sağlar).
- Veriler sadece o cihazda kalır. Yedek almak için “Tüm Verileri JSON Olarak İndir” kullan.
