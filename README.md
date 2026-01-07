# FinAInteli - Premium Personal AI Finance Assistant

A cross-platform React Native app (Expo) that uses Gemini AI to analyze your spending habits.

## Features

- 🤖 **AI-Powered Insights**: Get smart tips and detailed monthly reports.
- 📊 **Dashboard**: Visual breakdowns of income/expense.
- 🎯 **Goals**: AI-generated plans to reach your savings targets.
- 💬 **Chat Advisor**: Ask questions about your finances with context-aware answers.
- 🎨 **Premium UI**: Dark mode, smooth animations, and clean design.

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the root:

   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

   _Get a key from [Google AI Studio](https://makersuite.google.com/app/apikey)_

3. **Run the App**
   ```bash
   npx expo start
   ```

## Tech Stack

- **Framework**: Expo SDK 52 (React Native)
- **Router**: Expo Router (File-based navigation)
- **State**: Zustand + Persist
- **AI**: Google Gemini Pro
- **UI**: React Native Paper + Victory Charts
- **Storage**: Async Storage + Secure Store

## Structure

- `/app`: Screens and Navigation
- `/src/services`: API and Logic
- `/src/store`: State Management
- `/src/components`: Reusable UI

## Notes

- Demo data is seeded on first launch.
- "Reset Data" feature is safe for demos.
