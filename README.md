# FinAInteli - Premium Personal AI Finance Assistant

A cross-platform React Native app (Expo) that uses Gemini AI and Supabase to empower your financial life.

## 🌟 Key Features

### 🧠 AI Intelligence

- **Smart Advisor**: Get context-aware financial advice powered by Gemini.
- **Monthly Insights**: Automated analysis of your spending habits and savings opportunities.
- **Predictive Tips**: "Coach Marks" guide you through the app's features using smart overlays.

### 💼 Financial Management

- **Multi-Account Support**: Manage Checking, Savings, Investment, and Digital Wallet accounts.
- **Credit Cards**: Track limits, closing dates, and invoices with visual progress bars.
- **Transactions**: Log income and expenses with categorized details.
- **Multi-Currency**: Native support for BRL, USD, EUR, and more.

### 🎨 Adaptive UI/UX

- **Liquid Glass (iOS)**: Premium aesthetics with blur effects, gradients, and squircle shapes.
- **Material Design 3 (Android)**: Modern, colorful, and accessible interface following Google's latest guidelines.
- **Animations**: Smooth transitions powered by React Native Reanimated.

---

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54 (React Native 0.81)
- **Backend & Auth**: Supabase (PostgreSQL + RLS Security)
- **State Management**: Zustand
- **Navigation**: Expo Router (File-based)
- **AI Engine**: Google Gemini Pro (via Vercel AI SDK or Direct API)
- **Components**: React Native Paper v5
- **Animations**: React Native Reanimated 3
- **Internationalization**: i18next (PT-BR support)

---

## 🚀 Setup & Installation

1. **Prerequisites**
   - Node.js LTS
   - Expo Go app on your device

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the App**
   ```bash
   npx expo start
   ```

## 🛡️ Sentry (EAS Build)

Para upload automático de sourcemaps no EAS Build, configure a variável secreta `SENTRY_AUTH_TOKEN` nas variáveis do EAS (Project → Environment Variables).

Se você usa EAS Update, após cada `eas update` rode:

```bash
npm run sentry:upload-sourcemaps
```

---

## 💎 Premium Plans (Coming Soon)

FinAInteli offers a freemium model to sustain high-quality AI services.

| Feature         |    Free    | FinAInteli Pro (R$ 19,90/mo)  |
| :-------------- | :--------: | :---------------------------: |
| Bank Accounts   |   Max 2    |         **Unlimited**         |
| Credit Cards    |   Max 1    |         **Unlimited**         |
| AI Advisor      | 3 tips/day | **Unlimited & Deep Analysis** |
| Goals & Budgets |   Basic    |         **Advanced**          |
| Reports         |  Standard  |      **PDF/CSV Export**       |

---

## 🧪 Testing

Run strict type checking:

```bash
npx tsc --noEmit
```

Run linter:

```bash
npx expo lint
```

---

## 📁 Project Structure

- `app/`: Expo Router screens
- `src/components/`: Reusable UI components
- `src/services/`: Supabase and AI integration logic
- `src/store/`: Global state (Zustand)
- `src/i18n/`: Translations (pt-BR, en-US)
- `.context/`: Project documentation and plans

---

_This project is part of a portfolio demonstrating Advanced Agentic Coding._
