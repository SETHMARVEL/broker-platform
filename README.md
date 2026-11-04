# Apex Global Markets - Brokerage Platform

A modern, institutional-grade broker website and interactive WebTrader platform.

---

## 🚀 How to Deploy to Vercel

### Option 1: Automatic 1-Click with Vercel Token (Fastest)
If you have a free Vercel account:
1. Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens).
2. Run this PowerShell command in this folder:
   ```powershell
   .\deploy-vercel.ps1 -VercelToken YOUR_TOKEN_HERE
   ```
   *Your site will be deployed and open in your browser automatically.*

---

### Option 2: Deploy via GitHub (Recommended for Continuous Updates)
1. Create a new repository on [GitHub](https://github.com/new) (e.g. `apex-broker-platform`).
2. Upload this folder's contents:
   - `index.html`
   - `vercel.json`
   - `css/`
   - `js/`
3. Go to [vercel.com/new](https://vercel.com/new).
4. Select your GitHub repository and click **Deploy**.
5. Every time you push changes to GitHub, Vercel will automatically redeploy your site.

---

### Option 3: Deploy via Vercel CLI
1. Install [Node.js](https://nodejs.org/) if not already installed.
2. In terminal, run:
   ```bash
   npx vercel
   ```
3. Follow the quick login prompts in your browser to complete deployment.
