# Google Cloud Console Setup Guide

To enable Google Authentication in **ExpenseAudit AI**, follow these steps to obtain your `CLIENT_ID` and `CLIENT_SECRET`.

## 1. Create a New Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown and select **New Project**.
3. Name it `ExpenseAudit-AI` and click **Create**.

## 2. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen** (rebranded as **Google Auth Platform** in some regions).
2. Select **External** (unless you have a Google Workspace org).
3. Fill in the required app information:
   - **App name**: `ExpenseAudit AI`
   - **User support email**: Your email
   - **Developer contact info**: Your email
4. Click **Save and Continue** until you're back at the dashboard.

## 3. Create OAuth 2.0 Credentials

1. In the **Google Auth Platform** sidebar (from your screenshot), click on **Clients**.
2. Click **Create Client** (or **Create Credentials > OAuth client ID**).
3. Choose **Web application** for "Application type".
4. Add the following **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:5000`
5. Add the following **Authorized redirect URIs**:
   - `http://localhost:5000/api/auth/google/callback`
6. Click **Create**.

## 4. Save Your Credentials

- Copy the **Client ID** and **Client Secret**.
- Add them to your `server/.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

## 5. Enable People API (Optional but recommended)

1. Go to **APIs & Services > Library**.
2. Search for **Google People API** and click **Enable**.
