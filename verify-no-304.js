#!/usr/bin/env node

/**
 * HTTP 304 Prevention Verification Script
 * 
 * This script checks if the backend is properly configured to prevent HTTP 304 responses.
 * It makes multiple requests to dynamic endpoints and verifies they always return 200.
 */

const API_BASE = process.env.API_URL || 'http://localhost:5000';

// Test endpoints - all should return 200, never 304
const DYNAMIC_ENDPOINTS = [
    '/health',
    '/api/health',
    '/api/fees',
    '/api/quote-of-day'
];

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

async function testEndpoint(endpoint) {
    try {
        console.log(`\n${colors.bold}Testing: ${endpoint}${colors.reset}`);

        // First request
        const response1 = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        console.log(`  First request: ${response1.status} ${response1.statusText}`);
        console.log(`  Cache-Control: ${response1.headers.get('cache-control') || 'none'}`);
        console.log(`  ETag: ${response1.headers.get('etag') || 'none'}`);

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));

        // Second request (this would typically trigger 304 if caching enabled)
        const response2 = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        console.log(`  Second request: ${response2.status} ${response2.statusText}`);

        // Verify both requests returned 200
        if (response1.status === 200 && response2.status === 200) {
            console.log(`  ${colors.green}✓ PASS - Both requests returned 200${colors.reset}`);
            return true;
        } else if (response2.status === 304) {
            console.log(`  ${colors.red}✗ FAIL - Second request returned 304 (cached)${colors.reset}`);
            return false;
        } else {
            console.log(`  ${colors.yellow}⚠ WARN - Unexpected status codes${colors.reset}`);
            return false;
        }
    } catch (error) {
        console.log(`  ${colors.red}✗ ERROR - ${error.message}${colors.reset}`);
        return false;
    }
}

async function runTests() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.bold}HTTP 304 Prevention Verification${colors.reset}`);
    console.log(`API Base URL: ${API_BASE}`);
    console.log(`${'='.repeat(60)}\n`);

    const results = [];

    for (const endpoint of DYNAMIC_ENDPOINTS) {
        const passed = await testEndpoint(endpoint);
        results.push({ endpoint, passed });
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.bold}Summary${colors.reset}\n`);

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(r => {
        const status = r.passed
            ? `${colors.green}✓ PASS${colors.reset}`
            : `${colors.red}✗ FAIL${colors.reset}`;
        console.log(`  ${status} - ${r.endpoint}`);
    });

    console.log(`\n  Total: ${passed}/${total} passed`);

    if (passed === total) {
        console.log(`\n  ${colors.green}${colors.bold}All tests passed! ✓${colors.reset}`);
        console.log(`  ${colors.green}No 304 responses detected.${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`\n  ${colors.red}${colors.bold}Some tests failed! ✗${colors.reset}`);
        console.log(`  ${colors.red}304 responses detected. Check backend configuration.${colors.reset}\n`);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
});
