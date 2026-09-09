# 🌟 Lumina Blog — Full-Stack Vanilla Web Application

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Crypto](https://img.shields.io/badge/Web_Crypto_API-SHA--256-4f46e5?style=for-the-badge&logo=security&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Deployed on Render](https://img.shields.io/badge/Render-Static_Site-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

A high-performance, modern full-stack blog application built with **pure HTML5, CSS3 (Custom Properties), and Vanilla JavaScript (ES6+)**. Zero frameworks, zero external build tools, and zero third-party UI libraries (No React, No Bootstrap, No jQuery).

Persistent data is managed completely client-side in `localStorage` with hardware-accelerated **SHA-256 cryptographic hashing** via the browser's native **Web Crypto API**.

---

## ⚡ Key Highlights & Features

### 🔐 1. Cryptographic Authentication (`auth.js` & `auth.html`)
- **Native SHA-256 Hashing**: Passwords are encrypted before storage using `window.crypto.subtle.digest('SHA-256', ...)` — plain text passwords are never saved.
- **Expiring Session Tokens**: Generates cryptographically secure random session tokens with a 24-hour expiration timestamp.
- **Route Guarding**: Visiting the Author Dashboard (`dashboard.html`) without a valid unexpired session automatically redirects visitors to the login screen.
- **One-Click Demo Autofill**: Quick testing credentials pre-configured (`demo@example.com` / `Demo@123`).

### ✍️ 2. Protected Author Dashboard (`dashboard.html` & `app.js`)
- **Unlimited Post Creation**: Form resets cleanly after every submission so authors can publish multiple articles in a row without page reloads.
- **Canvas Auto-Compression**: Uploaded cover images are automatically resized and compressed using an offscreen HTML5 `<canvas>`, shrinking 5MB images to **~30KB–50KB Base64** to prevent browser storage quota issues.
- **Post Editing**: Load any article into the editor form with smooth scrolling and instant updates.
- **Protected Deletion**: Safe modal dialog before permanent removal from storage.
- **Dual-View Filter**: Switch between **"All Articles"** and **"My Articles"** with live counters (Total, Active, Drafts).

### 🌐 3. Public Blog Feed (`index.html` & `app.js`)
- **Active Filter**: Excludes unpublished drafts, displaying only active articles to visitors.
- **Real-Time Live Search**: Filters instantaneously as characters are typed across titles, descriptions, and author names.
- **Dynamic Sorting**: Instant switching between **"Newest First"** and **"Oldest First"**.
- **Interactive Reading Modal**: Pop-up article reader with full text formatting, cover artwork, author avatar, date, and reading time estimates.
- **Contextual Author Controls**: When an author is logged in, quick *Edit* and *Delete* action buttons appear directly on cards and inside the reader modal.

### 🎨 4. Modern Aesthetic Design System (`style.css`)
- Vibrant dark-slate theme with indigo glow accents and glassmorphic sticky headers (`backdrop-filter: blur(16px)`).
- Fluid CSS Grid layout adapting smoothly from mobile screens (375px) to wide monitors (1440px+).
- Google Fonts typography (`Plus Jakarta Sans` & `Space Grotesk`).
- Dynamic Toast notification feedback system.

---

## 📁 Repository Structure

```text
├── index.html       # Public blog feed, live search, sorting & article reader modal
├── dashboard.html   # Protected author dashboard with post creation, edit & delete
├── auth.html        # Dual-tab Sign In & Sign Up authentication screen
├── style.css        # CSS design system (tokens, responsive grid, glassmorphism)
├── auth.js          # Web Crypto SHA-256 hashing, session tokens, route guards
├── app.js           # Post CRUD engine, canvas image compressor, feed filters
├── render.yaml      # Render Infrastructure as Code (Blueprint)
├── package.json     # Project metadata and local preview scripts
├── .gitignore       # Git exclusion rules
└── README.md        # Comprehensive documentation
```

---

## 🚀 How to Deploy on Render.com

This project is configured for **100% automated deployment** on [Render](https://render.com) as a **Static Site**.

### Method 1: Automatic Blueprint Deployment (Recommended)
1. Push this repository to your GitHub account: `https://github.com/ApurvPandey0199/LuminaDashboard`
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Select your `LuminaDashboard` repository.
5. Render will detect `render.yaml` automatically and configure the static site.
6. Click **Apply** — your site will be live with free SSL in less than 30 seconds!

### Method 2: Manual Static Site Setup
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Static Site**.
3. Connect your GitHub repository: `ApurvPandey0199/LuminaDashboard`.
4. Enter the configuration:
   - **Name**: `lumina-dashboard`
   - **Branch**: `main`
   - **Build Command**: *(leave blank or `echo ready`)*
   - **Publish Directory**: `./` (or `.`)
5. Click **Create Static Site**.

---

## 💻 Local Development

You can run the project locally using any static web server:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js
npx serve . -p 8080
```

Then open `http://localhost:8080` in your web browser.

---

## 👤 Author

Developed by **[Apurv Pandey](https://github.com/ApurvPandey0199)**  
GitHub: [@ApurvPandey0199](https://github.com/ApurvPandey0199)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
