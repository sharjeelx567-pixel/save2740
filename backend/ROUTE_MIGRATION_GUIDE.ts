/**
 * Route Migration Helper
 * 
 * This script helps convert Next.js API routes to Express routes
 * 
 * Usage pattern:
 * 1. Find the Next.js route in app/api/[route]/route.ts
 * 2. Copy the handler function
 * 3. Apply these transformations:
 */

// ===== TRANSFORMATION GUIDE =====

// 1. IMPORTS
// Before (Next.js):
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SomeModel } from '@/lib/models/some-model';

// After (Express):
import { Request, Response } from 'express';
import { connectDB } from '../config/db';
import { SomeModel } from '../models/some-model';
import { authenticateToken, AuthRequest } from '../middleware/auth';

// 2. ROUTE DEFINITION
// Before (Next.js):
export async function POST(req: NextRequest) {
    // handler code
}

// After (Express):
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    // handler code
});

// 3. REQUEST BODY
// Before (Next.js):
const body = await req.json();
const { field1, field2 } = body;

// After (Express):
const { field1, field2 } = req.body;

// 4. GETTING USER ID
// Before (Next.js) - using cookies or JWT manually:
const token = req.cookies.get('authToken');
const decoded = jwt.verify(token, secret);
const userId = decoded.userId;

// After (Express) - using middleware:
const userId = req.userId; // From authenticateToken middleware

// 5. RESPONSES
// Before (Next.js):
return NextResponse.json(
    { success: true, data: result },
    { status: 200 }
);

// After (Express):
return res.status(200).json({
    success: true,
    data: result
});

// Or simply:
res.json({ success: true, data: result }); // status 200 is default

// 6. ERROR RESPONSES
// Before (Next.js):
return NextResponse.json(
    { success: false, error: 'Error message' },
    { status: 400 }
);

// After (Express):
return res.status(400).json({
    success: false,
    error: 'Error message'
});

// 7. DYNAMIC ROUTES
// Before (Next.js) - app/api/groups/[groupId]/route.ts:
export async function GET(
    req: NextRequest,
    { params }: { params: { groupId: string } }
) {
    const { groupId } = params;
}

// After (Express) - groups.routes.ts:
router.get('/:groupId', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { groupId } = req.params;
});

// 8. QUERY PARAMETERS
// Before (Next.js):
const searchParams = req.nextUrl.searchParams;
const category = searchParams.get('category');

// After (Express):
const { category } = req.query;

// 9. HEADERS
// Before (Next.js):
const authHeader = req.headers.get('authorization');

// After (Express):
const authHeader = req.headers.authorization;
// or
const authHeader = req.headers['authorization'];

// 10. COOKIES
// Before (Next.js):
const token = req.cookies.get('authToken')?.value;

// After (Express) - requires cookie-parser middleware:
const token = req.cookies.authToken;

// ===== COMPLETE EXAMPLE =====

// BEFORE (Next.js): app/api/profile/route.ts
/*
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models/auth.model';
import { connectDB } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const token = req.cookies.get('authToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
*/

// AFTER (Express): backend/src/routes/profile.routes.ts
/*
import express, { Response } from 'express';
import { User } from '../models/auth.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // req.userId already set by authenticateToken middleware
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
*/

// ===== COMMON PATTERNS =====

// Pattern: GET with query params
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { query, page, limit } = req.query;
    // Use query, page, limit
});

// Pattern: POST with body
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { name, email, ...otherFields } = req.body;
    // Use body fields
});

// Pattern: PUT/PATCH with ID
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    // Update item with id
});

// Pattern: DELETE with ID
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    // Delete item with id
});

// Pattern: Optional authentication (public endpoints)
import { optionalAuth } from '../middleware/auth';

router.get('/public', optionalAuth, async (req: AuthRequest, res: Response) => {
    // req.userId will be set if token provided, undefined otherwise
    if (req.userId) {
        // Authenticated user
    } else {
        // Public access
    }
});

// ===== CHECKLIST FOR EACH ROUTE =====
/*
□ Import express and Response
□ Import AuthRequest if using authentication
□ Import models from ../models/
□ Import services from ../services/
□ Import utilities from ../utils/
□ Create router = express.Router()
□ Apply authenticateToken middleware where needed
□ Convert req.json() to req.body
□ Convert params extraction
□ Convert query params extraction
□ Convert responses to res.json() or res.status().json()
□ Remove NextRequest, NextResponse references
□ Export default router
□ Connect route in src/app.ts
*/

export { };
