# RAS Currys Setup Script
# Run this script after cloning the repository

Write-Host "🍛 RAS Currys - Setup Script" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Cyan
$nodeVersion = node -v
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "⚠ Warning: Node.js v18 or higher is recommended" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Node.js not found. Please install Node.js v18 or higher" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Backend-only AI configuration
Write-Host "Checking environment configuration..." -ForegroundColor Cyan
if (Test-Path "backend/.env") {
    Write-Host "✓ backend/.env file found" -ForegroundColor Green
} else {
    Write-Host "⚠ backend/.env file not found." -ForegroundColor Yellow
    Write-Host "  Copy backend/.env.example to backend/.env and set server-only secrets there." -ForegroundColor Yellow
}
Write-Host ""

# Build test
Write-Host "Testing build process..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed. Please check for errors above" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "================================" -ForegroundColor Green
Write-Host "✓ Setup completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure GEMINI_API_KEY in backend/.env (never in a VITE_ variable)" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "  Admin: admin@ras.com / Admin123" -ForegroundColor White
Write-Host "  User:  user@ras.com / User1234" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Yellow
