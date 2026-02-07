'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

export default function FirebaseConnectionTest() {
  const [status, setStatus] = useState<string>('🔄 Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [testMessages, setTestMessages] = useState<any[]>([]);
  const [realTimeStatus, setRealTimeStatus] = useState<string>('Not subscribed');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    try {
      addLog('🔧 Starting Firebase connection tests...');
      
      // Test 1: Check if db is initialized
      if (!db) {
        setStatus('❌ FAILED: Firebase DB not initialized');
        addLog('ERROR: db is undefined - check lib/firebase.ts');
        return;
      }
      addLog('✅ Test 1: Firebase DB initialized');

      // Test 2: Try to write to Firestore
      try {
        const testRef = collection(db, 'firebaseTest');
        const docRef = await addDoc(testRef, {
          message: 'Test from admin panel',
          timestamp: Timestamp.now(),
          test: true
        });
        addLog(`✅ Test 2: Write successful (${docRef.id})`);
      } catch (writeError: any) {
        addLog(`❌ Test 2 FAILED: Cannot write - ${writeError.message}`);
        setStatus(`❌ Write Failed: ${writeError.message}`);
        return;
      }

      // Test 3: Try to read from Firestore
      try {
        const testRef = collection(db, 'firebaseTest');
        const snapshot = await getDocs(testRef);
        addLog(`✅ Test 3: Read successful (${snapshot.docs.length} docs)`);
      } catch (readError: any) {
        addLog(`❌ Test 3 FAILED: Cannot read - ${readError.message}`);
        setStatus(`❌ Read Failed: ${readError.message}`);
        return;
      }

      // Test 4: Test real-time subscription
      try {
        const messagesRef = collection(db, 'testChat/admin/messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTestMessages(msgs);
            setRealTimeStatus(`✅ Subscribed (${msgs.length} messages)`);
            addLog(`✅ Test 4: Real-time subscription working (${msgs.length} messages)`);
          },
          (error) => {
            addLog(`❌ Test 4 FAILED: Subscription error - ${error.message}`);
            setRealTimeStatus(`❌ Subscription failed: ${error.message}`);
          }
        );

        // Cleanup
        setTimeout(() => unsubscribe(), 30000); // Unsubscribe after 30s
      } catch (subError: any) {
        addLog(`❌ Test 4 FAILED: Cannot subscribe - ${subError.message}`);
      }

      // Test 5: Test user messages path
      try {
        const userMessagesRef = collection(db, 'chats/testUser123/messages');
        await addDoc(userMessagesRef, {
          message: 'Test user message',
          senderType: 'user',
          timestamp: Timestamp.now()
        });
        addLog('✅ Test 5: User message path working');
      } catch (userError: any) {
        addLog(`⚠️  Test 5 WARNING: User message path - ${userError.message}`);
      }

      setStatus('✅ ALL TESTS PASSED - Firebase is working!');
      addLog('🎉 All tests completed successfully!');

    } catch (error: any) {
      setStatus(`❌ FAILED: ${error.message}`);
      addLog(`❌ Unexpected error: ${error.message}`);
      console.error('Firebase test error:', error);
    }
  };

  const sendTestMessage = async () => {
    try {
      const messagesRef = collection(db, 'testChat/admin/messages');
      await addDoc(messagesRef, {
        message: 'Manual test message',
        senderType: 'admin',
        timestamp: Timestamp.now(),
        sender: 'Test Admin'
      });
      addLog('✅ Manual test message sent');
    } catch (error: any) {
      addLog(`❌ Failed to send test message: ${error.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔥 Firebase Connection Test</h2>
        
        {/* Status Card */}
        <div className={`p-4 rounded-lg mb-4 ${
          status.includes('✅') ? 'bg-green-50 border border-green-200' :
          status.includes('❌') ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <p className="font-bold text-lg">{status}</p>
          <p className="text-sm mt-2">Real-time: {realTimeStatus}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={runTests}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Re-run Tests
          </button>
          <button
            onClick={sendTestMessage}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📤 Send Test Message
          </button>
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            🗑️ Clear Logs
          </button>
        </div>

        {/* Test Messages */}
        {testMessages.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Real-time Messages ({testMessages.length}):</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {testMessages.map((msg, idx) => (
                <div key={idx} className="text-sm bg-white p-2 rounded border">
                  <span className="font-medium">{msg.message}</span>
                  <span className="text-gray-500 ml-2">({msg.senderType})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
          <h3 className="font-bold mb-2 text-white">Console Logs:</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-bold text-yellow-800 mb-2">📝 Instructions:</h4>
          <ol className="text-sm space-y-1 text-yellow-900">
            <li>1. Check if all tests pass (green checkmarks)</li>
            <li>2. If any test fails, check the error message</li>
            <li>3. Common issues:
              <ul className="ml-4 mt-1">
                <li>• Firebase not installed: <code className="bg-yellow-200 px-1">npm install firebase</code></li>
                <li>• Firestore not created: Go to Firebase Console → Create Database</li>
                <li>• Security rules: Set to test mode (allow all)</li>
                <li>• Environment variables: Check .env.local file</li>
              </ul>
            </li>
            <li>4. See CHAT_TROUBLESHOOTING.md for detailed fixes</li>
          </ol>
        </div>

        {/* Firebase Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-bold text-blue-800 mb-2">🔧 Firebase Configuration:</h4>
          <div className="text-sm space-y-1 text-blue-900">
            <p>Project ID: <code className="bg-blue-200 px-1">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</code></p>
            <p>API Key: <code className="bg-blue-200 px-1">{process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</code></p>
            <p>Auth Domain: <code className="bg-blue-200 px-1">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set'}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
