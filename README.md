# KOU Logistics

Kocaeli'nin ilçelerine kargo dağıtımı için araç rotaları hesaplayan ders projem. Kapasite kısıtlı araç rotalama problemi üzerinde çalıştım: hangi araç hangi yükü taşımalı, kapasite yetmezse ne yapılmalı ve toplam yol maliyeti nasıl azaltılmalı?

## Uygulama

- İki farklı rota oluşturma yaklaşımını karşılaştırıyor ve hesaplanan maliyeti düşük olanı seçiyor.
- Araç kapasitesini, sabit senaryoları ve gerektiğinde kiralık araç kullanımını hesaba katıyor.
- OSRM üzerinden yol bilgisi alıp Leaflet haritasında rotaları gösteriyor.
- Kullanıcı talep ekranı ve rota hesaplama paneli içeriyor.

Next.js, React, Tailwind CSS, Leaflet ve Recharts kullandım. Algoritma [vrpSolver.js](src/lib/vrpSolver.js), örnek ilçe/filo/senaryo verileri [data.js](src/lib/data.js) içinde.

## Çalıştırma

```bash
npm ci
npm run dev
```

Node.js 22.12 veya üzeri ile `http://localhost:3000` adresinde açılır. Üretim derlemesi için `npm run build`, ardından `npm start` kullanılır. Harita döşemeleri ve yol servisi için internet gerekir.

`/admin/dashboard` rota paneli, `/user` talep ekranıdır. `/api/verify-fleet` mevcut örnek senaryoları çalıştıran bir kontrol endpoint'idir.

## Sınırlar

Buradaki kullanıcı/yönetici ekranları ayrı sayfalardır; gerçek kimlik doğrulama ve rol yetkilendirmesi yoktur. Kargo talepleri kalıcı bir backend'de tutulmuyor. Çözüm sezgisel olduğu için matematiksel olarak en iyi rotayı garanti etmiyor. Gerçek dağıtım sistemi yerine algoritma ve arayüz denemesi olarak değerlendirmek gerekir.

## Kontroller ve bakım

`npm test` yüklerin kaybolmamasını, araç kapasitesini, kiralık araç kullanımını ve maliyet hesabını kontrol ediyor. `npm run lint` kaynak kontrolünü, `npm run build` üretim derlemesini çalıştırıyor. Bu kontroller GitHub Actions üzerinde de var.

Next.js 16, React 19 ve Tailwind 4'e geçtim; kullanılmayan Turf ve Axios paketlerini kaldırdım. Mevcut stil ayarlarını korumak için Tailwind yapılandırmasını bağladım. Derlemede önceki Webpack akışını kullanıyorum.

9 Ekim 2026 taramasında çalışma zamanı bağımlılıklarında bulgu yok. Tam `npm audit` sonucunda Next.js'in lint araç zincirindeki `braces` kaynaklı 5 yüksek bulgu kaldı; yayımlanmış bir düzeltme sürümü bulunmuyor. Bunları kapatılmış saymıyorum. Mevcut hydration effect'lerine ait 2 performans uyarısı da kaynak kontrolünde görünür kalıyor.
