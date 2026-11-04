# RAS Currys - Complete Feature Documentation

## ✅ Working Features

### 1. **Authentication & Authorization**
- **Sign-In/Sign-Up**: Robust form validation (email regex, password strength with 8+ chars, uppercase, lowercase, numbers).
- **Password Hashing**: SHA-256 with salt for secure storage (never exposed).
- **Session Management**: 24-hour expiry, automatic logout.
- **Role-Based Access**:
  - **USER**: Browse products, checkout, view orders, contact support, view own support tickets.
  - **ADMIN**: Manage products, orders (update status), view support tickets, see users (view-only).

---

### 2. **Product Management**
**Admin → Products**

#### Bulk Create (AI-Assisted)
- **Input Format**: Paste lines like `Pappu - 25`, `Chicken Curry - 60`, `Egg fry - 30`.
- **Auto-Parsing**:
  - Strips currency symbols (`₹`, `INR`), numbers, and separators (`-`, `:`).
  - Extracts name and price automatically.
- **Category Detection**: Auto-detects "Pickles" if name contains `pickle/achar/chutney`; otherwise sets to "Currys".
- **Description Generation**:
  - Uses **Gemini AI** (if `VITE_API_KEY` is set) to generate appetizing 1-sentence descriptions.
  - Fallback template: `"[Name] — a delicious Indian curry with aromatic spices and rich, home-style flavors."` when API unavailable.
- **Image Generation**:
  - Uses **LoremFlickr** with deterministic name-based lock: `https://loremflickr.com/400/300/indian,food,curry,{name}?lock={hash}`.
  - Validates image URL before saving; falls back to seeded **Picsum**: `https://picsum.photos/seed/{name}/400/300`.
  - Stored as **data URLs** (base64) to avoid exposing external links.

#### Single Product Add
- Manual form for Name, Price, Category, Description, and Image URL.
- Same image handling (LoremFlickr + Picsum fallback).

#### Edit Product
- Click **"Edit"** next to any product to open a modal.
- **Drag & Drop Image**:
  - Drag image files from your computer.
  - Paste image links from the web.
  - Paste image files (from clipboard).
- **Image Processing**:
  - Files converted to **data URLs** (stored locally, not exposed).
  - Web links fetched and converted to data URLs; CORS-blocked links show a placeholder SVG.
- **Fields**: Edit Name, Price, Category, Description, Image.
- **Save**: Updates product in real-time via `db.updateProduct()`.

#### Remove Listed Products
- Paste product names (same format as bulk create).
- Click **"Remove Listed Products"** to delete matching items.
- Confirmation required before deletion.

#### Product Display
- **Thumbnail**: 10×10px circular image with fallback `onError` handler.
- If image fails to load, automatically falls back to seeded Picsum.
- **Table Shows**: Product name, category badge (orange for Currys, green for Pickles), price, edit/delete actions.

---

### 3. **Orders & Checkout**
**Pages → My Orders / Checkout**

- **Browse Products**: View all Currys and Pickles with images, descriptions, and prices.
- **Add to Cart**: Select quantity and add items.
- **Checkout**: Review cart, enter email (optional), process payment via Paytm simulator.
- **Payment Flow**:
  - Mock Paytm gateway (simulated checksum and verification).
  - Order status transitions: `PENDING` → `PAID` → `SHIPPED` → `DELIVERED`.
- **My Orders**: Track order status in real-time. Admins can update delivery status.

---

### 4. **Support & AI Assistance**
**Pages → Contact & AI Help**

#### Gemini AI Chat
- **Model**: `gemini-2.0-flash-exp`.
- **Features**:
  - Interactive chatbot for product inquiries, delivery, pricing, ingredients, payment, refunds.
  - **Admin Tool**: Automatically creates support tickets for urgent issues (refunds, missing items, complaints).
  - **Order Number Extraction**: Detects order number from chat and includes in ticket.
- **Fallback FAQ**:
  - If API key not configured or fails, shows pre-built FAQ responses.
  - Detects urgent issues and auto-creates tickets even without API.

#### Support Tickets
- **Created By**: AI chat (when urgent issues detected) or user reports.
- **Admin → Support**: View all tickets with:
  - Urgency badges (HIGH: red, MEDIUM: orange, LOW: blue).
  - User contact info, issue summary, timestamp.
  - Status: OPEN (yellow) or RESOLVED (green).
  - **Mark Resolved**: Click "Mark Resolved" to update ticket status; reflected immediately.
- **User → My Support**: View only own tickets created via AI chat.
  - Lists with urgency, status, and timestamp.

---

### 5. **Admin Dashboard**
**Admin → Dashboard**

- **Stats Overview**:
  - Total orders count.
  - Total revenue (only PAID orders).
  - Recent orders (latest 5) with status and amounts.
- **Quick Stats Cards**: Styled with brand colors and icons.

---

### 6. **User Management**
**Admin → Users**

- **User List**: Shows standard user and admin accounts only.
- **Change Roles**: Authorized administrators can change USER ↔ ADMIN.

---

### 7. **Navigation & UI**
**Navbar**

- **Logged-Out**: Home, Menu, Contact & AI Help, Login, Sign Up.
- **Logged-In User**: Home, Menu, Contact & AI Help, My Orders, My Support, Cart, Logout.
- **Logged-In Admin**: + Dashboard link.
- **Mobile Menu**: Fully responsive with all links.

**Routing**
- User routes: `/`, `/products`, `/cart`, `/checkout`, `/login`, `/register`, `/orders`, `/contact`, `/support`.
- Admin routes: `/admin`, `/admin/products`, `/admin/orders`, `/admin/support`, `/admin/users`.

---

### 8. **Technical Stack**
- **Frontend**: React 19, TypeScript 5.8, Vite 6.x.
- **Styling**: Tailwind CSS 3.4, PostCSS, Autoprefixer.
- **Icons**: Lucide React.
- **Routing**: React Router 7.
- **AI**: Google Gemini (`@google/genai`).
- **Charts**: Recharts (for future analytics).
- **Database**: Mock localStorage-based DB with persistence.

---

## 🚀 How to Test

### Start Dev Server
```bash
cd c:\Users\Asus\Downloads\ras-currys
npm run dev
```
Open `http://localhost:3000` in your browser.

### Test Flows

#### 1. **Sign In & Browse**
- Register a test account, verify its email, then browse the menu and checkout.

#### 2. **AI Support**
- Go to "Contact & AI Help".
- Type: "I need a refund for order ORDER_123 because I didn't receive it."
- AI auto-detects urgency → creates support ticket.
- Check "My Support" to see your ticket.

#### 3. **Admin Features**
- Sign in with an administrator account created securely outside the repository.
- Go to "Dashboard".
- Click "Dashboard" → see stats.
- Go to "Products":
  - Paste bulk list:
    ```
    Pappu - 25
    Chicken Curry - 60
    Egg fry - 30
    ```
  - Click "Auto Generate with AI" → products added with images & descriptions.
  - Click "Edit" on a product → drag/drop new image → save.
  - Paste names in bulk box → click "Remove Listed Products" to delete.
- Go to "Orders":
  - Update order status (PENDING → PAID → SHIPPED → DELIVERED).
  - Admins see order list and can change status.
- Go to "Support":
  - See all user-reported tickets.
  - Click "Mark Resolved" to close a ticket.


## 📦 Deployment Ready
- **Build**: `npm run build` → production bundle in `dist/`.
- **SPA Routing**: Configured for Vercel (`vercel.json`) and Netlify (`netlify.toml`).
- **Environment**: `VITE_API_KEY` for Gemini; set in `.env.local` for dev, secrets for production.

---

## ⚙️ Configuration

### `.env.local` (Development)
```
VITE_API_KEY=your_google_genai_api_key_here
```

### `tailwind.config.js`
- Brand color: `#dc2626` (red-600 as primary).
- Font: Inter from Google Fonts.
- Custom spacing, borders, and utilities.

---

## 🐛 Known Behaviors
- **Image Fallback**: If any image fails to load, the table shows a seeded Picsum placeholder.
- **CORS**: Web image links are fetched and converted to data URLs; CORS-blocked links show an SVG placeholder.
- **Session**: 24-hour auto-logout; manual logout available in navbar.
- **Lazy Images**: LoremFlickr may vary slightly per request; use lock parameter for stability.

---

## 📝 Summary
A full-stack curry shop e-commerce platform with AI support, robust admin tools, role-based access, secure authentication, and production-ready deployment configs.
