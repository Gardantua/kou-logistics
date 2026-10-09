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

Node.js 22 ile `http://localhost:3000` adresinde açılır. Üretim derlemesi için `npm run build`, ardından `npm start` kullanılır. Harita döşemeleri ve yol servisi için internet gerekir.

`/admin/dashboard` rota paneli, `/user` talep ekranıdır. `/api/verify-fleet` mevcut örnek senaryoları çalıştıran bir kontrol endpoint'idir.

## Sınırlar

Buradaki kullanıcı/yönetici ekranları ayrı sayfalardır; gerçek kimlik doğrulama ve rol yetkilendirmesi yoktur. Kargo talepleri kalıcı bir backend'de tutulmuyor. Çözüm sezgisel olduğu için matematiksel olarak en iyi rotayı garanti etmiyor. Gerçek dağıtım sistemi yerine algoritma ve arayüz denemesi olarak değerlendirmek gerekir.

Bağımlılık bakımında uyumlu güncellemeler uygulandı ve derleme doğrulandı. Ancak kullanılan eski ana sürümlerde kalan güvenlik bulguları var; ayrı bir sürüm geçişi ve regresyon kontrolü gerekiyor. Açık internete sunulmadan veya dağıtılmadan önce bu bakımın tamamlanması gerekir.
