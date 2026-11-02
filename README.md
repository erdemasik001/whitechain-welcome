# Welcome to Whitechain

Whitechain'de ilk kontratını deploy eden kişi, kontrat adresini siteye yapıştırır ve devredilemeyen bir "Welcome to Whitechain" rozeti (NFT) alır.

Arada bir sunucu yok. Kontrolü rozet kontratı kendisi yapıyor.

## Yayındaki kontratlar (Whitechain Sepolia, chain 1874)

2 Kasım 2026'da deploy edildi, ikisi de explorer'da doğrulandı (verified):

| Kontrat | Adres |
| --- | --- |
| WelcomeToWhitechain (rozet) | [`0xA36dDeC8f8a346dcBB8231681d97a8a30fA392ce`](https://explorer.testnet.whitechain.io/address/0xA36dDeC8f8a346dcBB8231681d97a8a30fA392ce) |
| SlabRenderer (görsel) | [`0xbf125E84D3Bbd0eFbc5D9a06Ef0C7Bd0f64f83fF`](https://explorer.testnet.whitechain.io/address/0xbf125E84D3Bbd0eFbc5D9a06Ef0C7Bd0f64f83fF) |

Owner: `0x1d0025988EFDFef4A7Fd016571c8ed0E9aF8FEe3`. Sitenin `web/.env` dosyasındaki `VITE_BADGE_ADDRESS` bu rozet adresi.

Site: **https://whitechain-welcome.vercel.app** (Vercel projesi `whitechain-welcome`). Siteyi güncellemek için:

```bash
cd web
npm run build && npx vercel deploy dist --prod --yes --project whitechain-welcome
```

## Kontrol nasıl çalışıyor

Bir cüzdan bir kontratı doğrudan deploy ettiğinde (`forge create`, Remix ya da bir deploy script'i), yeni kontratın adresi sadece iki şeye bağlıdır: cüzdan adresi ve deploy işleminin nonce'u.

1. Site, bağlı cüzdanın kullandığı her nonce için bu adresi hesaplar ve yapıştırılan adresle eşleşeni bulur.
2. Kişi `claim(kontratAdresi, nonce)` çağırır.
3. Kontrat aynı hesabı `msg.sender` ile tekrar yapar. Adres eşleşiyor ve orada kod varsa rozeti basar.

Başkasının kontratını yapıştırmak işe yaramaz, çünkü o adres başka bir cüzdandan hesaplanır.

Kurallar:

- Cüzdan başına tek rozet.
- Rozet transfer edilemez (ERC-5192).
- Factory veya CREATE2 ile deploy edilen kontratlar kabul edilmez. Site bu durumda bunu açıkça söyler.

## Tasarım

Görünüm whitechain.io'nun kendi tasarım dilini izliyor:
- beyaz zemin ve ince gri çizgiler;
- düz Whitechain mavisi (`#0044FF`, resmi logodaki mavi) butonlar ve vurgular;
- lacivert yazı (`#07081E`);
- nokta ızgarası ve küçük mavi kareler;
- Onest ve JetBrains Mono yazı tipleri.

Gradyan ya da parlama yok.

Sayfanın yapısı Figma Community'deki "NFT Marketplace Website (free)" kitinden geliyor ([Figma dosyası](https://www.figma.com/design/t9JA2I5G4m33XAwO4KKJUI/NFT-Marketplace-Website--free---Community-)): büyük başlık, rozetin altındaki iki bilgi ve alttaki bilgi şeridi. Kitten görsel dosyası kullanılmadı. Figma Community dosyaları genelde CC BY 4.0 lisanslıdır; yayına almadan önce lisansı ve kaynak gösterme şartını dosyanın topluluk sayfasından kontrol et.

Bütün renkler `web/src/styles.css` dosyasının en üstünde değişken olarak tanımlı. Temayı değiştirmek için oradan başla.

Başlıktaki logo ve sekme ikonu resmi Whitechain logosu. Dosyalar `web/public/` içinde: `whitechain-logo.svg` (ikon ve yazı), `whitechain-icon.svg` (sadece ikon, telefonda bu görünür) ve `favicon.svg`. Bu SVG'ler Whitechain ekibinin gönderdiği JPG'lerden çizildi; JPG asıllar ve SVG'ler `../brand/` klasöründe. Ekip resmi bir SVG gönderirse aynı isimle bu dosyaların yerine koyman yeterli.

## Rozet görseli

Rozet, kart derecelendirme kutusu (PSA tarzı "slab") gibi görünüyor: şeffaf akrilik bir kutu, üstte etiket, içinde hologramlı bir Whitechain kartı. Etikette "2026 WHITECHAIN TÜRKİYE", rozet numarası, ilk kontratın kısa adresi, sertifika numarası ve kontrat adresinden üretilen bir barkod var. Kartın başlığında "whitechain TÜRKİYE" yazıyor. Hologram parıltısı ve kutunun üstünden geçen ışık görselin içinde; cüzdanda ve explorer'da da hareket ediyor. Sitede kutu fareyle 3D eğiliyor.

Görsel tamamen zincirde üretiliyor (yaklaşık 17 KB SVG), sunucu ya da IPFS gerekmiyor. Etiket çerçevesi PSA'nın kırmızısı yerine Whitechain mavisi, PSA adı ve logosu da kullanılmıyor (onların markası).

Görselin aslı `design/slab.mjs` içinde. Kontrat bunu birebir yeniden üretiyor:

- `design/slab-prototype.html`: tasarımı tarayıcıda gösterir, numara ve adresi değiştirip deneyebilirsin.
- `design/build-contract.mjs`: `slab.mjs`'ten `contracts/src/SlabArt.sol` dosyasını (görselin sabit parçaları), test örneklerini ve sitenin `web/public/badge-preview.svg` önizlemesini üretir.
- `contracts/src/SlabRenderer.sol`: sabit parçaların arasına yıl, adres, numara ve barkodu yerleştirir. Testler sonucu `slab.mjs`'in çizdiğiyle bayt bayt karşılaştırır.

## Klasörler

```
contracts/   Foundry projesi
  src/WelcomeToWhitechain.sol   Rozet kontratı (claim, soulbound, renderer değiştirme)
  src/SlabRenderer.sol          Rozet görseli (zincir üstünde SVG)
  src/SlabArt.sol               Görselin sabit parçaları (design/build-contract.mjs üretir, elle değiştirme)
  src/IWelcomeRenderer.sol      Görsel kontratlarının arayüzü
  script/Deploy.s.sol           Rozet + görseli deploy eder
  script/SetRenderer.s.sol      Yeni görsele geçirir
  test/fixtures/                slab.mjs'in çizdiği örnek görseller (testler bunlarla karşılaştırır)
design/      Rozet görselinin aslı (slab.mjs), prototip sayfası ve kontrat üretme script'i
web/         Vite + React + wagmi sitesi (TR/EN)
```

## 1. Kontratları deploy et

```bash
cd contracts
forge test
```

`forge test`, canlı Whitechain Sepolia üzerinde de bir test çalıştırır. İnternet yoksa `--no-match-contract Fork` ekle.

Deploy komutu keystore şifreni soracağı için kendi terminalinde çalıştır:

```bash
forge script script/Deploy.s.sol \
  --rpc-url whitechain_sepolia \
  --account whitechain-sepolia \
  --broadcast \
  --verify --verifier blockscout --verifier-url https://explorer.testnet.whitechain.io/api/
```

Çıktıda `Owner:` satırının senin adresin olduğunu kontrol et. Owner'ın tek yetkisi görseli değiştirmek. Rozet basamaz, alamaz ve silemez.

## 2. Siteyi çalıştır

```bash
cd web
cp .env.example .env
```

`.env` içine deploy çıktısındaki `VITE_BADGE_ADDRESS` değerini, istersen de `VITE_TUTORIAL_URL` (tutorial videosunun linki) değerini yaz.

```bash
npm install
npm run dev
```

Yayına almak için `npm run build` komutunu çalıştır. Çıkan `dist/` klasörü statik bir sitedir; Vercel, Netlify veya GitHub Pages'e olduğu gibi yüklenebilir. Ortam değişkenlerini hosting panelinde de tanımlamayı unutma.

Kontratları değiştirirsen ABI'yi yenile:

```bash
(cd ../contracts && forge build) && npm run abi
```

## 3. Rozet görselini değiştirmek

1. `design/slab.mjs` içinde değişikliği yap. Sonucu görmek için prototip sayfasını aç:

   ```bash
   node web/node_modules/vite/bin/vite.js design --port 5180
   ```

   Sonra tarayıcıda `http://localhost:5180/slab-prototype.html` adresine git.
2. Kontratın parçalarını, test örneklerini ve sitenin önizlemesini yeniden üret, sonra testleri çalıştır:

   ```bash
   node design/build-contract.mjs
   (cd contracts && forge test)
   ```

   Script, rozete özel değerlerin (yıl, adres, numara, barkod) sırası değişirse durur ve hata verir. O zaman `SlabRenderer.svg()` içindeki sırayı da güncelle.

Rozet henüz deploy edilmediyse normal deploy yeterli. Rozet deploy edildiyse görseli değiştirmek, şimdiye kadar basılmış rozetler dahil hepsinin görselini değiştirir; rozet kontratına dokunmak gerekmez:

1. Yeni `SlabRenderer`'ı deploy et:

   ```bash
   cd contracts
   forge create src/SlabRenderer.sol:SlabRenderer \
     --rpc-url whitechain_sepolia --account whitechain-sepolia --broadcast
   ```

2. Rozeti yeni renderer'a bağla:

```bash
BADGE_ADDRESS=0x... RENDERER_ADDRESS=0x... forge script script/SetRenderer.s.sol \
  --rpc-url whitechain_sepolia --account whitechain-sepolia --broadcast
```

Kontrat, explorer ve cüzdanların görseli yenilemesi için ERC-4906 olayı yayınlar.

## Yerel test

Whitechain Sepolia'nın yerel bir kopyasını aç; gerçek kontratlar da içinde olur:

```bash
anvil --fork-url https://rpc.testnet.whitechain.io --chain-id 1874
```

Rozeti anvil'e deploy etmek için:

```bash
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Sonra `web/.env.local` dosyasına şunları yaz:

```
VITE_RPC_URL=http://127.0.0.1:8545
VITE_BADGE_ADDRESS=<anvil'e deploy edilen rozet adresi>
VITE_DEMO_WALLET=0xe64c79726DD1ab65b76ef4f237724b000657593B
```

`VITE_DEMO_WALLET`, sayfaya "Demo Wallet" adında sahte bir cüzdan ekler. Bu cüzdan sadece `npm run dev` ile çalışır ve yayın build'ine girmez. Anvil'in bu hesap adına imza atabilmesi için hesabı açman ve bakiye vermen gerekir:

```bash
cast rpc anvil_impersonateAccount 0xe64c79726DD1ab65b76ef4f237724b000657593B
cast rpc anvil_setBalance 0xe64c79726DD1ab65b76ef4f237724b000657593B 0x8AC7230489E80000
```

Bu cüzdan, Whitechain Sepolia'da `0x6d1A36885424c41FaCdA6A51b47Fcdf1e1EF9901` kontratını deploy etmiş gerçek bir hesap. Bu adresle rozet alınabilir.

İşin bitince `.env.local` dosyasını sil. `npm run build` de bu dosyayı okur; silmezsen yayına giden site yerel zincire bağlı kalır.
