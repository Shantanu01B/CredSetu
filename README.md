# CredSetu: Empowering Self-Help Groups (SHGs) through Financial Technology

**CredSetu** is a comprehensive financial management platform designed to digitize and empower Self-Help Groups (SHGs). It provides a robust ecosystem for tracking savings, managing loans, calculating member trust scores, and assessing group health to facilitate easier access to credit and financial services.

---

## 🚀 Vision & Mission

CredSetu aims to bridge the gap between traditional SHGs and formal banking systems. By providing a data-driven approach to financial reliability, we enable SHGs to build a credible financial history, reducing risks for both members and lending institutions.

---

## ✨ Key Features

### 💎 Member Trust Score
A dynamic scoring system (0-900) that evaluates individual member reliability based on:
- **Financial Actions:** Savings deposits (+2), on-time repayments (+5), late repayments (-10).
- **Loan History:** Successfully completed loans (+20), defaulted loans (-20).
- **Community Engagement:** Meeting attendance (+1), consecutive absence penalties (-5).

### 🏥 SHG Health Score
A group-level metric (0-100) that measures the overall stability of the SHG, factoring in:
- Average Member Trust Score (40%)
- Loan Repayment Ratio (30%)
- Fund Growth Rate (20%)
- Pending Loan Ratio Penalty (10%)

### 🚨 Automated Risk Engine
Real-time monitoring and alerts for:
- Critical Group Health (Score < 50).
- Low Member Trust Scores (Score < 600).
- Repayment risks and engagement gaps.

### 💳 Integrated Payments
Seamless integration with **Razorpay** for:
- Secure savings deposits.
- Hassle-free loan repayments.
- Real-time transaction verification.

### 📊 Multi-Stakeholder Dashboards
- **Member Dashboard:** Track personal savings, trust scores, and loan status.
- **SHG Admin Dashboard:** Manage member activities, approve loans, and monitor group funds.
- **Bank Manager Dashboard:** Evaluate SHG health for credit allocation and monitor risk watchlists.

---

## 🛠️ Tech Stack

### Backend
- **Node.js & Express:** Scalable server-side architecture.
- **MongoDB & Mongoose:** NoSQL database for flexible data modeling.
- **JWT:** Secure authentication and authorization.
- **Socket.io:** Real-time updates for notifications and risk alerts.
- **Razorpay SDK:** Reliable payment gateway integration.
- **PDFKit:** Professional report generation for SHG audits.

### Frontend
- **React (Vite):** Fast and modern UI development.
- **Tailwind CSS:** Responsive and premium-feeling design.
- **Recharts:** Interactive data visualization for scores and trends.
- **Socket.io-client:** Real-time state synchronization.
- **React-hot-toast:** User-friendly notifications.

---

## 📦 Project Structure

```text
CredSetu/
├── backend/            # Express Server & API
│   ├── controllers/    # Business logic
│   ├── models/         # Database schemas (User, SHG, Loan, Transaction)
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth & Error handling
│   ├── utils/          # Helper functions (Trust score logic, risk engine)
│   └── server.js       # Entry point
├── frontend/           # React Application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Dashboard & Auth views
│   │   ├── services/   # API & Socket integration
│   │   └── App.jsx     # Main routing
│   └── vite.config.js  # Vite configuration
└── TrustScoreLogic.txt # Core logic documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance
- Razorpay API keys (test mode recommended)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/CredSetu.git
cd CredSetu
```

### Step 2: Backend Configuration
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add the following keys:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Step 3: Frontend Configuration
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📜 License
This project is licensed under the ISC License.

---

## 👥 Contributors
Developed by Shantanu and the CredSetu Team.
