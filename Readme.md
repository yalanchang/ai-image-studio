# AI 圖片工作室

以 TypeScript 打造的 AI 智慧圖片生成與編輯平台。

## 🚀 主要功能

- AI 智慧圖片生成
- 圖片編輯與處理
- 現代化全端架構（前端 / 後端分離）
- Drizzle ORM 資料庫整合

## 🛠 技術堆疊

|層級   |技術                   |
|-----|---------------------|
|前端   |TypeScript、Vite、React|
|後端   |Node.js、TypeScript   |
|資料庫  |Drizzle ORM          |
|樣式   |CSS                  |
|測試   |Vitest               |
|程式碼格式|Prettier             |

## 📁 專案結構

```
ai-image-studio/
├── client/           # 前端應用程式
├── server/           # 後端 API 伺服器
├── shared/           # 共用型別與工具函式
├── drizzle/          # 資料庫遷移與 Schema
├── patches/          # 套件修補檔
├── vite.config.ts    # Vite 設定檔
├── vitest.config.ts  # 測試設定檔
├── drizzle.config.ts # 資料庫設定檔
└── tsconfig.json     # TypeScript 設定檔
