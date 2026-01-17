/**
 * Database Health Check API
 * GET /api/health/db - Check MongoDB connection status
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getConnectionStatus } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Get connection status without connecting
    const isConnected = getConnectionStatus();
    const readyState = mongoose.connection.readyState;
    
    // ReadyState values:
    // 0 = disconnected
    // 1 = connected
    // 2 = connecting
    // 3 = disconnecting
    
    const readyStateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    // Try to connect if not connected
    let connectionInfo: any = {
      status: readyStateMap[readyState] || 'unknown',
      readyState,
      isConnected,
      host: mongoose.connection.host || 'N/A',
      port: mongoose.connection.port || 'N/A',
      name: mongoose.connection.name || 'N/A',
    };

    if (!isConnected) {
      try {
        const conn = await connectDB();
        connectionInfo = {
          status: 'connected',
          readyState: mongoose.connection.readyState,
          isConnected: true,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          message: 'Successfully connected to MongoDB',
        };
      } catch (error: any) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to connect to MongoDB',
            details: {
              status: 'disconnected',
              readyState: mongoose.connection.readyState,
              isConnected: false,
              error: error.message,
              connectionString: process.env.DATABASE_URL 
                ? `${process.env.DATABASE_URL.substring(0, 20)}...` 
                : 'Using default connection string',
            },
          },
          { status: 503 }
        );
      }
    }

    // Test a simple query
    let queryTest = false;
    try {
      const collections = await mongoose.connection.db?.admin().listDatabases();
      queryTest = true;
      connectionInfo.collections = collections?.databases?.length || 0;
    } catch (error: any) {
      connectionInfo.queryTest = false;
      connectionInfo.queryError = error.message;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...connectionInfo,
          queryTest,
          timestamp: new Date().toISOString(),
          environment: {
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            databaseUrlLength: process.env.DATABASE_URL?.length || 0,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Database health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database health check failed',
        details: error.message,
        connectionStatus: {
          readyState: mongoose.connection.readyState,
          isConnected: getConnectionStatus(),
        },
      },
      { status: 500 }
    );
  }
}
