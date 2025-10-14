
# 🧠 CogniFlow

**CogniFlow** is a modern and minimalist application for **knowledge organization**, inspired by Logseq and Obsidian.  
It allows you to create **thematic blocks**, **linked notes**, **interactive mind maps**, and **flashcards**, with the help of **AI (Gemini)** to intelligently summarize and connect ideas.

---

## ☕ Support My Coffee ☕

If you like **CogniFlow** or find it useful, you can invite me for a coffee to help continue developing new features 💙

👉 [**Buy Me a Coffee**](https://www.buymeacoffee.com/aesirsoft)

---

## ✨ Main Features

- 🧩 **Thematic Blocks** — Organize your ideas by knowledge areas.  
- 🗒️ **Linked Notes** — Connect concepts easily, like a digital brain.  
- 🧠 **AI Summaries (Gemini)** — Automatically summarize your notes.  
- 🌐 **Graph Viewer** — Visualize your ideas as a network of connections.  
- 🃏 **Flashcards** — Strengthen learning with active recall.  
- 🎨 **Customizable Visual Themes**:
  - **Matrix** — Neon green on black.  
  - **Aurora** — Violet and blue gradient.  
  - **Minimal Light** — Blue on white.  
  - **Solarized** — Teal blue on beige.  

---

## ⚙️ Installation (local)

Follow these steps to run **CogniFlow** locally.

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/cogniflow.git
cd cogniflow
````

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Create the `.env.local` file

In the project root create `.env.local` and add your Gemini key:

```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

Replace `PLACEHOLDER_API_KEY` with your actual key from Google AI Studio.

### 4️⃣ Run development server (frontend only)

```bash
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## 💻 Desktop build with Tauri (create .exe)

This project includes a `src-tauri/` folder. To produce a Windows executable (`.exe`) or other OS bundles, follow these steps.

### Prerequisites

* Node.js and npm installed.
* Rust toolchain (includes `cargo`) installed and available in PATH.

  * Install via [https://rustup.rs](https://rustup.rs) or `winget install --id Rustlang.Rustup` on Windows.
* Tauri CLI installed in the project:

```bash
npm install --save-dev @tauri-apps/cli
```

### Build steps (recommended)

1. Build the frontend (Vite) to produce `dist/`:

```bash
npm run build
```

2. Ensure `src-tauri/tauri.conf.json` is configured to point to `../dist`:

```json
"build": {
  "beforeBuildCommand": "npm run build",
  "beforeDevCommand": "npm run dev",
  "frontendDist": "../dist",
  "devPath": "http://localhost:5173"
}
```

3. Build the native app with Tauri:

```bash
npx tauri build
```

or with an npm script (add to `package.json`):

```json
"scripts": {
  "tauri:build": "tauri build",
  "tauri:dev": "tauri dev"
}
```

then run:

```bash
npm run tauri:build
```

### Result / Output

After a successful build, packaged files and installers are created under:

```
src-tauri/target/release/bundle/
```

Example Windows installer/executable paths:

* `src-tauri/target/release/bundle/msi/YourApp_1.0.0_x64.msi`
* `src-tauri/target/release/bundle/nsis/YourApp_1.0.0.exe`
* Also, you'll have the raw binary at `src-tauri/target/release/your-app-name.exe`

> If you configured NSIS as a target, expect an `.exe` installer under the `nsis` folder.

#### Notes

* If Tauri complains it cannot find the frontend, ensure `dist/` exists and `frontendDist` in `tauri.conf.json` points to `../dist`.
* For development (hot reload in desktop window), use:

```bash
npm run tauri:dev
# or
npx tauri dev
```

This runs your Vite dev server and opens the Tauri window loading `http://localhost:5173`.

---

## 🧠 Project structure (as in your workspace)

```
cogniflow/
├── components/
├── dist/                # built frontend (Vite) -> used by Tauri build
├── hooks/
├── locales/
├── node_modules/
├── services/
├── src-tauri/           # Tauri config & Rust bundle
│   ├── tauri.conf.json
│   └── icons/
├── utils/
├── .env.local
├── App.tsx
├── index.html
├── index.tsx
├── vite.config.ts
├── package.json
└── README.md
```

---

## 🔧 Quick `package.json` snippets

Add these scripts to your `package.json` for convenience:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "tauri:dev": "tauri dev",
  "tauri:build": "tauri build"
}
```

---

## 📜 License

This project is licensed under the **MIT License**. You are free to use, modify, and share it as long as proper attribution is maintained.

---

### 🚀 Connect your mind. Flow with knowledge.

**CogniFlow — your digital space to think better.**



