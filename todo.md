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

## Bug 修復
- [x] 修復 createImageJob / createGalleryItem insertId 為 NaN 導致查詢失敗

## 重試功能
- [x] 後端：新增 images.retry tRPC 路由（退還積分 + 重新提交任務）
- [x] 前端 Generate 頁面：失敗時顯示重試按鈕
- [x] 前端 MyImages 頁面：失敗的圖片卡片顯示重試按鈕
- [x] 新增重試相關 Vitest 測試（18 個測試全部通過）

## 品牌標語改寫
- [x] 改寫首頁 Hero 主標題、副標題與 CTA 文案

## Auth0 整合
- [ ] 取得 Auth0 憑證並設定環境變數
- [ ] 安裝 @auth0/auth0-react 與後端 JWT 驗證套件
- [ ] 後端：替換 Manus OAuth 為 Auth0 JWT 驗證中介層
- [ ] 後端：用戶首次登入自動建立/同步資料庫記錄
- [ ] 前端：Auth0Provider 包裹 App，替換所有登入/登出邏輯
- [ ] 前端：更新 useAuth hook 使用 Auth0 狀態
- [ ] 更新 Vitest 測試

## Auth0 整合 Bug 修復
- [x] 修復 main.tsx tRPC client 每次渲染重建導致 client[procedureType] is not a function
- [x] 清理 Generate.tsx 重複的 trpc import
- [x] 清理 MyImages.tsx / Credits.tsx 殘留的 useAuth / getLoginUrl

## Auth0 登入跳回首頁 Bug
- [x] 排查登入/註冊按鈕點擊後跳回首頁的原因（VITE_AUTH0_AUDIENCE 無效導致 access_denied）
- [x] 修復 main.tsx 移除無效的 VITE_AUTH0_AUDIENCE（Manus 平台注入的值不是有效 Auth0 API Identifier）
- [x] 修復 server/_core/auth0.ts 移除無效的 AUTH0_AUDIENCE
- [x] 修復 main.tsx JSX 語法錯誤（authorizationParams: {} → authorizationParams={{}}）
- [x] Auth0 登入頁面正常顯示（Email/Password + Google 社交登入）

## 待完成功能
- [x] 重試次數限制（最多 3 次）
- [x] 新增 retryCount 欄位至 image_jobs 表，推送 DB migration
- [x] 前端重試按鈕顯示剩餘次數，達上限後顯示禁用訊息
- [x] Vitest 測試更新（20 個測試全部通過）
- [ ] 圖片上傳功能（風格遷移用）
- [ ] Auth0 Application Name 更新為 INSTANT（目前顯示 My App）
