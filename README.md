# KOU Logistics — Web Tabanlı CVRP Çözücü

Kocaeli Üniversitesi Bilgisayar Mühendisliği
Yazılım Laboratuvarı III — 2025-2026 Güz Dönemi

## Proje Hakkında

Kocaeli'nin 12 ilçesine yapılacak kargo dağıtımını optimize eden, web tabanlı **Kapasite Kısıtlı Araç Rotalama Problemi (CVRP)** çözücüsüdür. Sistem; araç kapasitesi, yol mesafesi ve kiralama maliyetlerini göz önünde bulundurarak en düşük maliyetli dağıtım rotalarını otomatik olarak hesaplar.

## Özellikler

- **İki rekabetçi algoritma** — Her optimizasyonda iki strateji çalışır, düşük maliyetli sonuç seçilir
- **Gerçek yol mesafeleri** — OSRM (OpenStreetMap) ile haversine yaklaşımı yerine gerçek yol geometrisi
- **Esnek filo yönetimi** — Kapasite aşımında otomatik kiralık araç ataması
- **Cargo Rescue** — Sığmayan kargolar için ikinci geçiş ile en yakın araca atama
- **İnteraktif harita** — Leaflet ile araç rotaları ve simülasyon
- **Kullanıcı & Yönetici paneli** — Kargo talebi oluşturma ve rota optimizasyonu
- **Senaryo geçmişi** — Tüm optimizasyon sonuçları kaydedilir ve karşılaştırılır

## Algoritma

### Strateji A — Paralel Ekleme (Clarke-Wright Savings)
Her istasyon için ayrı rota oluşturulur. İki rotayı birleştirmenin sağladığı tasarruf hesaplanarak en verimli araç yükleme planı elde edilir.

### Strateji B — Maximin Seeding + Paralel En Yakın Komşu
Araçlar haritaya homojen dağıtılır (maximin seeding). Ardından her araç şu metrikle bir sonraki durağını seçer:

```
Maliyet = Mesafe + (1.3 × Sapma)
```

1.3 katsayısı, aracı hem yakın noktalara hem de depo yönünde ilerlemeye teşvik eder.

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Kullanım

| Sayfa | URL | Açıklama |
|---|---|---|
| Ana Sayfa | `/` | Giriş |
| Kullanıcı Paneli | `/user` | Kargo talebi oluştur, takip et |
| Yönetici Paneli | `/admin/dashboard` | Rota optimizasyonu, harita, analitik |
| Test API | `/api/verify-fleet` | Senaryo 1, 3, 4 doğrulama |

## Senaryolar

| Senaryo | Toplam Yük | Özellik |
|---|---|---|
| 1 | 1445 kg | Tüm 12 ilçe, dengeli dağılım |
| 2 | 905 kg | Dengesiz dağılım, optimizasyon kritik |
| 3 | 2700 kg | Kapasite aşımı — kiralık araç gerekli |
| 4 | 1150 kg | Araç sayısı optimizasyonu |

## Araç Filosu

| Araç | Kapasite | Kiralama Maliyeti |
|---|---|---|
| V1 | 1000 kg | 0 (sahip) |
| V2 | 750 kg | 0 (sahip) |
| V3 | 500 kg | 0 (sahip) |
| Kiralık | 500 kg | 200 birim |

Yol maliyeti: **1 birim/km**

## Teknoloji Yığını

- **Next.js 14** — React framework, App Router
- **Tailwind CSS** — Arayüz tasarımı
- **Leaflet + React Leaflet** — İnteraktif harita
- **OSRM API** — Gerçek yol mesafesi ve geometrisi
- **Recharts** — Analitik grafikler
- **Framer Motion** — Animasyonlar

## Proje Yapısı

```
src/
├── app/
│   ├── page.js                  # Ana sayfa
│   ├── user/page.js             # Kullanıcı paneli
│   ├── admin/dashboard/page.js  # Yönetici paneli
│   └── api/verify-fleet/        # Test endpoint
├── components/
│   ├── Map/CommandMap.js        # Leaflet harita bileşeni
│   └── Dashboard/StatCard.js   # İstatistik kartı
└── lib/
    ├── vrpSolver.js             # VRP algoritması
    └── data.js                  # İstasyon ve senaryo verileri
```

## Geliştirici

**Yunus Emre Arı** — Kocaeli Üniversitesi Bilgisayar Mühendisliği
