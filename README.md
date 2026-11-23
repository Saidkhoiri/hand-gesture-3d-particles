# ✨ Interactive Hand Gesture 3D Particles

Visualisasi partikel 3D interaktif berbasis web yang dikendalikan secara real-time menggunakan gerakan tangan & jari melalui webcam. Dibangun dengan **Three.js** untuk rendering 15.000 partikel bercahaya lewat GPU dan **MediaPipe Tasks Vision** untuk pelacakan titik kunci tangan (*hand landmark tracking*).

## 🖐️ Kontrol Gestur Tangan

| Gestur Tangan | Bentuk Partikel | Nuansa Warna | Efek Animasi |
| :--- | :--- | :--- | :--- |
| **✊ Mengepal (0 Jari)** | Ledakan Debu Bintang | *Vibrant Purple* | Partikel berhamburan melayang bebas |
| **☝️ 1 Jari (Telunjuk)** | Planet Saturnus | *Golden Yellow & Orange* | Cincin berlapis dengan celah *Cassini* |
| **✌️ 2 Jari (*Peace*)** | Galaksi Spiral | *Vibrant Purple* | 5 lengan spiral berputar dengan inti cahaya |
| **🤟 3 Jari** | Kupu-Kupu 3D | *Purple to Pink Gradient* | Sayap mengepak lembut lengkap dengan antena |
| **🖐️ 4–5 Jari Terbuka** | Teks *"I Love You"* 3D | *Vibrant Purple* | Merapat saat 4 jari, mekar lebar saat 5 jari |
| **🫰 *Saranghaeyo* (*Finger Heart*)** | Hati 3D (*Love*) | *Neon Crimson Red* | Berdenyut lembut menghadap depan |
| **👋 Geser Telapak Tangan** | Rotasi 360° | *Dynamic (Sesuai Bentuk)* | Memutar sudut pandang objek 3D secara halus |

> **Pintasan Keyboard:** Anda juga dapat menekan tombol angka **`0` sampai `6`** pada keyboard untuk mengganti setiap bentuk secara manual.

## 🛠️ Teknologi yang Digunakan
* **[Three.js](https://threejs.org)** — Rendering grafis 3D WebGL (`THREE.Points` & `BufferGeometry`) dengan efek *additive blending*.
* **[MediaPipe Tasks Vision](https://google.com)** — Deteksi 21 titik sendi tangan secara lokal di browser.
* **[Vite](https://vite.dev)** — *Build tool* dan server pengembangan cepat berbasis JavaScript modern.

## 🚀 Cara Menjalankan di Komputer Lokal

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com
   cd hand-gesture-3d-particles
   ```

2. **Instal pustaka yang dibutuhkan:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```

4. Buka alamat lokal yang muncul di terminal (biasanya `http://localhost:5173`) melalui Google Chrome atau Microsoft Edge, lalu klik **Allow** saat diminta izin akses webcam.