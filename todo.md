# AI Image Studio - Project TODO

## Phase 1: Database & Schema
- [x] Design and push database schema (users, images, credits, gallery, jobs)
- [x] Add credit transactions table
- [x] Add image jobs queue table
- [x] Add gallery/community table

## Phase 2: Backend Core
- [x] Image generation tRPC router (generate, edit, status)
- [x] Credit system router (balance, deduct, recharge, history)
- [x] Image history router (list, search, filter, delete)
- [x] Gallery router (public images, likes, shares)
- [x] Prompt assistant router (optimize prompt via LLM)
- [x] Admin router (users, stats, credit management)
- [x] WebSocket real-time job progress
- [x] S3 file storage integration for images
- [x] Job queue with concurrency control (max 5 concurrent)

## Phase 3: Frontend Core
- [x] Global AppLayout with sidebar navigation
- [x] Landing/Home page with feature showcase
- [x] Image generation page with prompt input and style controls
- [x] Real-time progress indicator via WebSocket
- [x] Credit balance display in header

## Phase 4: Feature Pages
- [x] Image gallery page (public community feed with masonry layout)
- [x] My images / history page with search and filter
- [x] Image editing page (style transfer, background, object removal)
- [x] Prompt assistant UI (AI-optimized prompts inline)
- [x] Image detail modal with sharing options

## Phase 5: Admin Dashboard
- [x] Admin dashboard with system stats
- [x] User management table (role, credits, status)
- [x] Credit recharge management (packages)
- [x] System usage analytics charts

## Phase 6: Testing & Delivery
- [x] Vitest unit tests for credit system (14 tests, all passing)
- [x] Vitest unit tests for image generation router
- [x] Final checkpoint and delivery

## 繁體中文本地化
- [x] AppLayout 導航欄與側邊欄
- [x] Home 首頁 Landing Page
- [x] Generate 圖像生成頁面
- [x] Gallery 社群圖庫頁面
- [x] MyImages 我的圖片頁面
- [x] Credits 積分管理頁面
- [x] Admin 管理後台頁面
- [x] NotFound 404 頁面
