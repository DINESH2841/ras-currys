# 🍛 RAS Currys - E-commerce Platform

A modern, production-ready e-commerce platform for authentic Indian curries and pickles, built with React, TypeScript, and Vite.

## ✨ Features

### 🔐 Authentication & Security
- **Secure Sign-up & Sign-in** with password hashing (SHA-256 simulation)
- **Real-time form validation** with helpful error messages
- **Password strength requirements**: Min 8 chars, uppercase, lowercase, and number
- **Session management** with 24-hour expiry
- **Email validation** with proper regex patterns
- **Password visibility toggle** for better UX
- **Role-based access control** (User & Admin)

### 🛒 E-commerce Features
- Product catalog with categories (Currys & Pickles)
- Shopping cart with persistent storage
- Secure checkout with Paytm simulation
- Order tracking and history
- Admin dashboard with analytics

### 🤖 AI Customer Support
- Gemini AI-powered chat support
- Automated ticket creation for complex issues
- Context-aware responses about products, delivery, and pricing

### 📊 Admin Features
- Product management (Add, Edit, Delete)
- Order management with status updates
- Support ticket monitoring
- Revenue and sales analytics
- Real-time dashboard with charts (Recharts)

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ras-currys
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### New Registration
- Click "Create a new account" on the login page
- Fill in your details with a strong password
- Requirements: Name (2+ chars), Valid email, Password (8+ chars with uppercase, lowercase, and number)

## 📦 Project Structure

```
ras-currys/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Navbar.tsx
│   │   └── ProductCard.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx       # Enhanced with sign-up
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Orders.tsx
│   │   ├── Contact.tsx     # AI support
│   │   └── admin/          # Admin pages
│   ├── services/           # Business logic
│   │   ├── authContext.tsx # Authentication
│   │   ├── cartContext.tsx # Shopping cart
│   │   └── mockDatabase.ts # Mock backend
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   ├── types.ts            # TypeScript types
│   ├── constants.ts        # App constants
│   ├── config.ts           # Environment config
│   └── index.css           # Global styles
├── .env.local              # Environment variables
├── tailwind.config.js      # Tailwind CSS config
├── vite.config.ts          # Vite configuration
└── package.json
```

## 🌐 Deployment to Production

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_KEY` with your Gemini API key

### Option 2: Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI or Dashboard**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Set environment variables**
   - Site Settings → Build & Deploy → Environment
   - Add `VITE_API_KEY`

### Option 3: Static Hosting (GitHub Pages, Cloudflare Pages)

1. **Update `vite.config.ts` with base path** (if needed)
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   });
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy `dist` folder** to your hosting provider

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_KEY` | Google Gemini API Key for AI support | Yes (for AI) | - |
| `VITE_BASE_URL` | Base URL for production | No | Current origin |

### Tailwind CSS Customization

Brand colors can be customized in `tailwind.config.js`:

```javascript
colors: {
  brand: {
    50: '#fff7ed',
    // ... customize your brand colors
    900: '#7c2d12',
  }
}
```

## 🧪 Testing

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🛡️ Security Features

1. **Password Hashing**: SHA-256 with salt (simulated - use bcrypt in real backend)
2. **Session Management**: 24-hour expiry with localStorage
3. **Input Validation**: Real-time form validation on both frontend
4. **XSS Protection**: React's built-in escaping
5. **HTTPS**: Recommended for production (automatic with Vercel/Netlify)

## 📝 Features Roadmap

- [ ] Backend API integration (replace mockDatabase)
- [ ] Real payment gateway integration
- [ ] Email verification for sign-up
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Order invoice generation (PDF)
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Multi-language support
- [ ] Advanced search and filters

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React & Vite for the excellent development experience
- Tailwind CSS for utility-first styling
- Lucide React for beautiful icons
- Recharts for data visualization
- Google Gemini AI for intelligent customer support

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@rascurrys.com (demo)

---

Made with ❤️ and 🌶️ by the RAS Currys Team
