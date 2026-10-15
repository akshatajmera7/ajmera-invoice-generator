# Ramswaroop Nirmal Kumar Ajmera - Tax Invoice Generator

Official, mobile-friendly GST Tax Invoice Generator web application for **Ramswaroop Nirmal kumar ajmera** (Sadar Bazar, Banera).

Built with React, Vite, and Vanilla CSS for lightning-fast performance, pixel-perfect A4 printing, direct PDF download, and WhatsApp/Mobile sharing.

---

## 🌟 Key Features

- **Official Commercial GST Bill Design**:
  - Exact layout replicating standard Indian GST tax invoice specifications.
  - Authentic typography and crisp borders matching company invoices.
  - Centered **House of Ajmera** medallion emblem.
  - Seller Details: Sadar Bazar, Banera | GSTIN: `08ACZPA7669Q1ZC` | Phone: `9929335953`, `9414255366` | State: `Rajasthan`.

- **Automated 5% GST Calculations (2.5% CGST + 2.5% SGST)**:
  - Live, real-time calculations for every item.
  - Tax summary table breaking down CGST (2.5%), SGST (2.5%), and Total Tax.
  - **Invoice Amount in Words** converter following Indian numbering conventions (Rupees & Paise).

- **Cheque-Verified Banking Details & PhonePe**:
  - Pre-filled defaults from the official cancelled cheque:
    - **Bank Name**: State Bank of India, Banera
    - **Account Number**: `37146612448`
    - **IFSC Code**: `SBIN0031097`
    - **Account Holder**: `RAMSWAROOP NIRMAL KUMAR AJMERA`
    - **PhonePe / UPI**: `9414255366`
  - Fully editable in the form anytime.

- **Mobile-First Responsive Experience**:
  - Optimized for smartphone usage with top navigation tabs (`Fill Bill Details` & `View Tax Invoice`).
  - Fixed thumb-friendly bottom action bar with **Share PDF** and **Download PDF**.
  - Smart A4 zoom scaling (`Fit Phone Screen` vs `Actual Size`).
  - Numeric touch keyboards (`inputMode="decimal"`).

- **1-Click PDF Download & Sharing**:
  - High-resolution single-page A4 `.pdf` generation via `html2canvas` and `jsPDF`.
  - **Share PDF**: Leverages native mobile Web Share API to directly share the `.pdf` file via WhatsApp, Email, Drive, or Telegram.
  - Fallback share modal for desktop with direct WhatsApp summary integration.

---

## 🚀 Quick Start Locally

```bash
# Clone the repository
git clone https://github.com/akshatajmera7/ajmera-invoice-generator.git

# Navigate to project directory
cd ajmera-invoice-generator

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🌐 Easy 1-Click Deployment to Vercel

1. Go to [Vercel](https://vercel.com/) and sign in with your GitHub account (`akshatajmera7`).
2. Click **"Add New..."** -> **"Project"**.
3. Import the repository: `akshatajmera7/ajmera-invoice-generator`.
4. Framework Preset will automatically detect **Vite**.
5. Click **"Deploy"**.
6. In less than 30 seconds, your invoice generator website will be live with a permanent URL!

---

## 📦 Tech Stack

- **Frontend**: React 18
- **Bundler & Tooling**: Vite
- **Styling**: Vanilla CSS (Mobile-first responsive design, print CSS media queries)
- **Icons**: Lucide React
- **PDF Generation**: html2canvas & jsPDF
