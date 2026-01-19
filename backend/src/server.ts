// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import the rest
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB()
    .then(() => {
        console.log('✅ Database connected successfully');

        // Start server
        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        });
    })
    .catch((error) => {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
