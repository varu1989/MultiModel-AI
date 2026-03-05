# JaipurEyeVision Studio - PRD

## Original Problem Statement
Build a complete production-ready multimodal AI SaaS platform named JaipurEyeVision Studio with:
- Content Generator (Blogs, Ads, Email, Social, Scripts)
- Code Generator (Write, Debug, Explain, Refactor, Test)
- Research Expert (Executive Summary, Insights, Risks, Actions)
- Audio Generator (TTS + STT)
- Image Generator + Editor
- Video Generator
- Automatic RAG System
- MCP Tool System
- Admin Dashboard
- Razorpay Subscription System (INR)
- Credits Engine

## User Personas
1. **Content Creators** - Use content, image, video generation
2. **Developers** - Use code generation, debugging, testing
3. **Researchers** - Use research expert, RAG knowledge base
4. **Business Users** - Use all features with subscription management
5. **Admins** - Manage users, credits, monitor system

## Core Requirements
- React + FastAPI + MongoDB architecture
- JWT authentication with role-based access
- Credit-based usage system
- Razorpay payment integration (INR)
- Dark/Light theme toggle
- Responsive dashboard design

## What's Been Implemented (Feb 26, 2026)

### Backend
- [x] FastAPI server with all endpoints (/api prefix)
- [x] MongoDB models for users, documents, chunks, jobs, usage logs
- [x] JWT authentication with bcrypt password hashing
- [x] Admin user seeding (admin@jaipureyevision.com / admin@3036)
- [x] Credits engine with validation and deduction
- [x] RAG system with document upload, chunking (800 tokens, 120 overlap)
- [x] All generation endpoints (content, code, research, tts, stt, image, video)
- [x] MCP Tools registry with 10 tools
- [x] Razorpay subscription integration (6 INR plans)
- [x] Admin endpoints (users, usage, errors, documents, revenue)

### Frontend
- [x] Landing page with login/signup
- [x] Dashboard with stats, quick actions, recent activity
- [x] Content Generator page with type/tone/length selection
- [x] Code Generator with 5 action modes
- [x] Research Expert with structured output
- [x] Audio page (TTS with 9 voices, STT with upload)
- [x] Image Generator + Editor
- [x] Video Generator with job tracking
- [x] Knowledge Base (RAG document management)
- [x] History page with filters
- [x] Billing page with 6 Razorpay plans
- [x] Settings page
- [x] Admin Dashboard (users, usage, errors, documents, subscriptions)
- [x] Dark/Light theme toggle
- [x] Glassmorphic sidebar design
- [x] Join Live Session button

### Integrations
- OpenAI GPT-5.2 for text generation (Emergent LLM Key)
- Gemini Nano Banana for image generation (Emergent LLM Key)
- OpenAI Sora 2 for video generation (Emergent LLM Key)
- OpenAI TTS (tts-1) for text-to-speech (Emergent LLM Key)
- OpenAI Whisper for speech-to-text (Emergent LLM Key)
- Razorpay for payments (User's test keys)

## Subscription Plans
| Plan | Duration | Credits | Price (INR) |
|------|----------|---------|-------------|
| 1 Day | 1 day | 5 | ₹250 |
| 7 Days | 7 days | 50 | ₹1,400 |
| 15 Days | 15 days | 100 | ₹2,500 |
| 30 Days | 30 days | 200 | ₹4,500 |
| 180 Days | 180 days | 500 | ₹11,000 |
| 365 Days | 365 days | 1000 | ₹20,000 |

## Credit Costs
- Content: 2 credits
- Code: 2 credits
- Research: 3 credits
- Image: 5 credits
- Video: 20 credits
- TTS: 1 credit
- STT: 2 credits

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Authentication flow
- [x] All generation endpoints
- [x] Subscription/payment flow
- [x] Admin dashboard

### P1 - High Priority (Next)
- [ ] Email notifications for subscription
- [ ] Webhook endpoint for Razorpay events
- [ ] Video download with signed URLs
- [ ] Rate limiting implementation
- [ ] Input validation with Pydantic

### P2 - Medium Priority
- [ ] User profile editing
- [ ] Password reset flow
- [ ] Export generated content
- [ ] Batch generation
- [ ] API usage analytics charts

### P3 - Low Priority
- [ ] Mobile responsive optimization
- [ ] PWA support
- [ ] Social sharing
- [ ] Team/organization support
- [ ] API key management for external access

## Deployment Configuration (Added Feb 26, 2026)
- Railway configuration: `/app/backend/railway.toml`, `Procfile`
- Vercel configuration: `/app/frontend/vercel.json`
- Environment examples: `.env.example` files in both directories
- Full deployment guide: `/app/DEPLOYMENT_GUIDE.md`

### Razorpay QR Code Payment
- UPI QR code enabled in checkout configuration
- Supports: Google Pay, PhonePe, Paytm via QR
- Also supports: Cards, Netbanking, Wallets, UPI Collect

## Next Tasks
1. Test actual AI generation flows with real prompts
2. Add Razorpay webhook endpoint for async events
3. Implement rate limiting
4. Add email notifications
5. Deploy to production (Railway + Vercel) - Guide ready!
