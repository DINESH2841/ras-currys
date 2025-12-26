# 🚀 Deployment Checklist for RAS Currys

Use this checklist to ensure your application is production-ready before deployment.

## Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] All ESLint warnings addressed
- [ ] Build completes successfully (`npm run build`)
- [ ] Production build tested locally (`npm run preview`)

### ✅ Security
- [ ] Environment variables properly configured
- [ ] `.env.local` added to `.gitignore`
- [ ] Password hashing implemented
- [ ] Session management configured (24-hour expiry)
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] HTTPS configured (automatic on Vercel/Netlify)

### ✅ Performance
- [ ] Images optimized
- [ ] Lazy loading implemented where needed
- [ ] Bundle size reviewed (currently ~900KB - consider code splitting for future)
- [ ] Caching headers configured
- [ ] API calls optimized

### ✅ Content & Features
- [ ] All pages accessible and functional
- [ ] Authentication (Sign-in/Sign-up) working
- [ ] Shopping cart functionality tested
- [ ] Checkout process working
- [ ] Admin dashboard accessible
- [ ] AI support chat functional (requires Gemini API key)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility tested

### ✅ Configuration Files
- [ ] `vercel.json` or `netlify.toml` created
- [ ] `.gitignore` includes sensitive files
- [ ] `package.json` scripts configured
- [ ] Environment variables documented in README

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   ```
   VITE_API_KEY=your_gemini_api_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables**
   - Go to Site Settings → Build & Deploy → Environment
   - Add: `VITE_API_KEY=your_gemini_api_key`

4. **Deploy**
   - Click "Deploy site"
   - Your site will be live at `https://your-project.netlify.app`

### Option 3: Manual/Custom Server

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload `dist` folder**
   - Upload to your hosting provider (e.g., AWS S3, DigitalOcean)
   - Configure web server (nginx/Apache) to serve SPA

3. **Configure Environment**
   - Set environment variables on server
   - Ensure HTTPS is enabled

## Post-Deployment Checklist

### ✅ Testing on Production
- [ ] Visit your deployed URL
- [ ] Test sign-up with new account
- [ ] Test sign-in with demo accounts
- [ ] Add items to cart
- [ ] Complete checkout process
- [ ] Test admin dashboard access
- [ ] Test AI support chat
- [ ] Test on mobile devices
- [ ] Test on different browsers

### ✅ Performance Verification
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Check page load times
- [ ] Verify all images load correctly
- [ ] Test with slow network connection

### ✅ SEO & Meta Tags
- [ ] Page title displays correctly
- [ ] Meta descriptions added (future enhancement)
- [ ] Social media preview working (future enhancement)
- [ ] Sitemap created (future enhancement)

### ✅ Monitoring
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics setup (e.g., Google Analytics)
- [ ] Uptime monitoring configured

## Common Issues & Solutions

### Build Fails
- **Issue**: Build command fails
- **Solution**: Run `npm run build` locally to identify errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Environment Variables Not Working
- **Issue**: API calls fail in production
- **Solution**: Ensure env vars are prefixed with `VITE_`
- Verify they're set in hosting dashboard
- Rebuild after adding env vars

### 404 Errors on Page Refresh
- **Issue**: Direct URL access returns 404
- **Solution**: Configure SPA routing in `vercel.json` or `netlify.toml`
- Both files included in project already

### Large Bundle Size Warning
- **Issue**: Build warns about chunk size
- **Solution**: Implement code splitting (future enhancement)
- Current size (900KB) is acceptable for initial release

## Optimization Recommendations (Post-Launch)

1. **Code Splitting**
   - Use dynamic imports for admin routes
   - Lazy load Recharts library
   - Split vendor bundles

2. **Image Optimization**
   - Use Next.js Image or similar for automatic optimization
   - Implement WebP format with fallbacks
   - Add loading="lazy" to images

3. **Caching Strategy**
   - Configure service workers (PWA)
   - Implement API response caching
   - Use CDN for static assets

4. **Backend Integration**
   - Replace mockDatabase with real API
   - Implement proper authentication backend
   - Add rate limiting and security measures

## Support & Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [React Documentation](https://react.dev/)

## Success Criteria

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ All features work as expected
- ✅ Performance is acceptable (< 3s load time)
- ✅ Mobile experience is smooth
- ✅ Authentication works correctly
- ✅ No console errors in production

---

**Ready to deploy? Follow the steps above and your RAS Currys e-commerce platform will be live! 🚀**
