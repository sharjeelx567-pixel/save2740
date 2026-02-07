/**
 * Firebase Admin SDK Configuration
 * For server-side operations, FCM notifications, and Firestore access
 */

import admin from 'firebase-admin';

let app: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (app) {
    return app;
  }

  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      app = admin.apps[0]!;
      return app;
    }

    // Initialize with service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          projectId: process.env.FIREBASE_PROJECT_ID || 'bee-project-f73ed',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

/**
 * Get Firebase Admin instance
 */
export function getFirebaseAdmin(): admin.app.App {
  if (!app) {
    return initializeFirebaseAdmin();
  }
  return app;
}

/**
 * Get Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  const adminApp = getFirebaseAdmin();
  return adminApp.firestore();
}

/**
 * Get Firebase Cloud Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging {
  const adminApp = getFirebaseAdmin();
  return adminApp.messaging();
}

export default {
  initializeFirebaseAdmin,
  getFirebaseAdmin,
  getFirestore,
  getMessaging,
};
