# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Vercel Deployment Instructions

When deploying this application to Vercel, the file upload feature will not work until you configure your environment variables. Your API keys are stored locally in the `.env` file, which is not committed to Git for security reasons.

To fix this, you must add your ImageKit credentials to your Vercel project settings:

1.  **Log in to your Vercel account.**
2.  Navigate to your project's dashboard.
3.  Go to the **Settings** tab.
4.  In the side menu, click on **Environment Variables**.
5.  Add the following three variables, copying the values from your local `.env` file:
    *   `IMAGEKIT_PUBLIC_KEY`
    *   `IMAGEKIT_PRIVATE_KEY`
    *   `IMAGEKIT_URL_ENDPOINT`
6.  After adding the variables, **re-deploy** your project for the new settings to take effect. You can trigger a new deployment from the "Deployments" tab in your Vercel project dashboard.
