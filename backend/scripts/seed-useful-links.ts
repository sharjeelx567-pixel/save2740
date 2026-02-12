/**
 * Seed default Useful Links (policy pages) for CMS.
 *
 * Run from the BACKEND directory (not admin-panel):
 *   cd backend
 *   npm run seed-useful-links
 * Or: npx ts-node scripts/seed-useful-links.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from '../src/config/db';
import { UsefulLink } from '../src/models/useful-link.model';

const DEFAULTS = [
  { slug: 'privacy-policy', title: 'Privacy Policy', displayOrder: 1 },
  { slug: 'terms-conditions', title: 'Terms & Conditions', displayOrder: 2 },
  { slug: 'savings-challenge-disclaimer', title: 'Savings Challenge Disclaimer', displayOrder: 3 },
  { slug: 'subscription-refund-policy', title: 'Subscription & Refund Policy', displayOrder: 4 },
  { slug: 'affiliate-referral-policy', title: 'Affiliate / Referral Policy', displayOrder: 5 },
];

const PLACEHOLDER_HTML = '<p>Content is managed from the Admin Panel under <strong>Useful Links</strong>. Edit this page there.</p>';

async function seed() {
  try {
    await connectDB();
    let created = 0;
    for (const d of DEFAULTS) {
      const existing = await UsefulLink.findOne({ slug: d.slug });
      if (!existing) {
        await UsefulLink.create({
          ...d,
          content: PLACEHOLDER_HTML,
          enabled: true,
          status: 'published',
          versions: [],
        });
        created++;
        console.log('Created:', d.slug);
      }
    }
    console.log('Done. Created', created, 'links.');
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
