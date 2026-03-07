# CMS Landing Page — Migration Services

This project is a fully responsive landing page with its own admin panel, based on a Figma design. Content is stored in a `JSON` file and managed via a custom CMS; the frontend loads and displays it dynamically. You can edit texts, links, and lists without touching the code.

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no heavy frameworks)
- **Backend:** Node.js, Express.js (REST API)
- **Storage:** Local `content.json` file (`server/data/content.json`)
- **File uploads:** Images are saved via Multer to `server/uploads/`

---

## Features

1. **Responsive layout**
   - Uses `clamp()` and fluid sizing for desktop and mobile. No horizontal scroll on any device.

2. **Headless CMS**
   - All texts, service types, and contact details are edited in the Node.js admin panel. Lists (links, contacts, services, etc.) are managed with a dynamic array editor and add/remove buttons instead of editing JSON by hand.

3. **Block order and visibility**
   - In the admin you can reorder blocks (move up/down) and show or hide each block.

4. **SEO**
   - The admin has an SEO section; the frontend uses it to set `<meta name="description">`.

---

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) installed.

### Install and start the server

From the project root or the `server` folder, run:

```bash
cd server
npm install
npm start
```

The app usually runs at http://localhost:3001.

### URLs

| Page            | URL                                | Description                    |
|-----------------|------------------------------------|--------------------------------|
| **Landing**     | [http://localhost:3001/](http://localhost:3001/)           | Public landing page            |
| **Admin panel** | [http://localhost:3001/admin](http://localhost:3001/admin) | Edit content (CMS)             |

---

## Using the Admin Panel

1. Open [http://localhost:3001/admin](http://localhost:3001/admin).
2. Find the block you want to edit (e.g. SEO, Hero, Header) and change the text or links.
3. For lists (nav items, contacts, services, etc.) use **+ Добавить элемент** to add rows, or remove/reorder them.
4. Click the blue **Сохранить** (Save) button at the bottom.
5. Reload the main site ([http://localhost:3001/](http://localhost:3001/)) with **F5** to see your changes.

> The logo (`public/logo.png`) and main hero image (`bg.png`) are loaded from the frontend folder, not from the CMS, so they are not editable in the admin.

---

## Project Structure

```text
CMS_Landing/
├── client/                 # Frontend
│   ├── index.html          # Main HTML
│   ├── style.css           # Styles
│   ├── app.js              # Fetches and renders content from the API
│   └── public/             # Static assets (logo.png, bg.png)
├── server/                 # Backend (Node.js)
│   ├── data/
│   │   └── content.json    # CMS content (edited via admin)
│   ├── public/             # Admin panel assets
│   │   ├── admin.html
│   │   ├── admin.css
│   │   └── admin.js
│   ├── uploads/            # Uploaded images (Multer)
│   ├── package.json
│   └── server.js           # Express server
└── README.md
```
