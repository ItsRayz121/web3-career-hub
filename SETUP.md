# Web3 Career Hub — Setup Guide

## 1. Create Supabase Project
1. Go to https://supabase.com → New Project
2. Copy your Project URL and anon key from Settings → API

## 2. Run the Database Schema
1. In Supabase → SQL Editor
2. Open `supabase/schema.sql` from this project
3. Run the full SQL — creates all tables, policies, triggers, and seed data

## 3. Set Environment Variables
Edit `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-claude-api-key
```

### Get your API keys:
- **Supabase**: supabase.com → Project Settings → API
- **Anthropic (Claude)**: console.anthropic.com → API Keys

## 4. Run the App
```bash
npm run dev
```
Open: http://localhost:3000

## 5. First Steps
1. Register at /register
2. Go to Profile Hub → fill in your information
3. Import from LinkedIn: Profile → Import tab → paste LinkedIn page text
4. Go to CV Maker or Resume Maker to generate your first document
5. Check Jobs tab for real-time Web3/blockchain opportunities

## Features Built
- Dashboard with profile completion tracker
- Full Profile Hub (Personal, Experience, Education, Skills, Certifications, Projects)
- LinkedIn CSV/text import with AI parsing
- CV Maker (AI-generated, human-quality)
- Resume Maker (role-targeted)
- Cover Letter Maker (human-tone, not AI-sounding)
- AI Detection Checker (on every generated document)
- ATS Checker (compare resume vs job description)
- Real-time Jobs (RemoteOK, CryptoJobsList, Web3.career RSS feeds)
- Collaborations (filtered from live job feeds)
- Scholarships & Grants (10 curated real Web3/academic sources)
- Opportunity Tracker (Kanban pipeline: Saved → Applied → Interview → Offer/Rejected)
- Saved Items (documents + opportunities)
- Prompt Library (10 pre-built prompts for Web3, BD, content, marketing, veterinary)
