// Vercel Serverless Function - Enhanced Error Handling
export const config = {
    api: {
        bodyParser: false, // Let Express handle body parsing
    },
};

let app: any = null;

try {
    // Lazy load the app to catch initialization errors
    console.log('🔄 Initializing Backend App...');
    const appModule = require('../src/app');
    app = appModule.default || appModule;
    console.log('✅ Backend App Initialized Successfully');
} catch (error: any) {
    console.error('❌ CRITICAL: Backend Initialization Failed:', error);
    // We cannot recover here, but we can log extensively
}

export default async function handler(req: Request, res: Response) {
    // If initialization failed, return detailed error
    if (!app) {
        console.error('❌ Request received but app is not initialized.');
        return res.status(500).json({
            error: 'Backend failed to start',
            message: 'Serverless function initialization error',
            timestamp: new Date().toISOString()
        });
    }

    try {
        // Forward request to Express app
        return app(req, res);
    } catch (err: any) {
        console.error('❌ Request Handling Error:', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
        });
    }
}
