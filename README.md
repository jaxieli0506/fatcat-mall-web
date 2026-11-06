# Fat Cat 購物商城 — 前端

> 資展國際（iSpan）結訓專題・4 人團隊・2025/07 – 2025/08
> 以 **Vue 3 + Vite** 打造的電商平台前端（前台購物網站 + 後台管理系統），搭配 [後端 API](https://github.com/jaxieli0506/fatcat-mall-api)。

<!-- TODO: 放幾張畫面截圖 / GIF（首頁、登入、會員中心、後台） -->
<!-- ![首頁](docs/home.png) -->

## 技術棧

| 類別 | 使用技術 |
|---|---|
| 框架 | Vue 3（Composition API）、Vite、Vue Router、Pinia |
| UI | Bootstrap 5、Bootstrap Icons、Font Awesome、SweetAlert2 |
| API 串接 | Axios（統一實例 + 攔截器自動帶入 JWT） |
| 即時功能 | SignalR（線上客服）、Amazon IVS Player（直播） |
| 圖表 | Chart.js / vue-chartjs（後台營運分析） |
| 第三方登入 | Google Identity Services、Facebook SDK、LINE Login |

## 系統功能

- **前台**：商品瀏覽 / 分類 / 搜尋、購物車、收藏、結帳（宅配 / 超商取貨）、綠界付款、訂單查詢、商品評論、客訴進度追蹤、優惠券與活動、通知中心、直播觀看、線上客服
- **後台**：管理員登入、儀表板、會員 / 管理員管理、商品上架、訂單與出貨、評論檢舉審核、活動與優惠券、通知發送、操作紀錄、營運分析圖表、直播開播、客服聊天

## 🙋‍♀️ 我負責的部分

> 前端也由我擔任 **Git 整合負責人**；原始團隊 repo 共 522 個 commits，個人貢獻 181 個（含合併），為團隊最多。

### 1. 會員登入 / 註冊 / 第三方登入
- 登入頁整合 Google、Facebook、LINE 三種第三方登入；LINE 採 OAuth redirect，另建 callback 頁面處理授權碼
- 會員中心可綁定第三方帳號
- 忘記密碼、重設密碼、修改密碼流程
- 相關檔案：[`LoginForm.vue`](src/components/LoginForm.vue)、[`exLoginService.js`](src/services/exLoginService.js)、[`LineCallbackView.vue`](src/views/LineCallbackView.vue)、[`ForgotPasswordView.vue`](src/views/ForgotPasswordView.vue)、[`stores/auth.js`](src/stores/auth.js)

### 2. 統一 API 層與 Token 管理
- 建立共用 Axios 實例，以 **request interceptor** 依 API 路徑自動帶入會員或管理員的 JWT
- 解決前台會員與後台管理員**同時登入時 Token 混用**的問題（分開儲存 `token` / `adminToken`）
- 相關檔案：[`jjapi.js`](src/services/jjapi.js)、[`stores/adminauth.js`](src/stores/adminauth.js)

### 3. 會員中心與地址管理
- 個人資料編輯、收件地址管理（縣市 / 區域連動下拉選單）
- 串接綠界電子地圖選擇 7-11 取貨門市，並帶入購物車與結帳流程
- 結帳頁加入登入路由守衛（未登入不可結帳）
- 相關檔案：[`UserView.vue`](src/views/UserView.vue)、[`AddressForm.vue`](src/components/AddressForm.vue)、[`AddressManager.vue`](src/components/AddressManager.vue)、[`ShippingForm.vue`](src/components/ShippingForm.vue)

### 4. 通知系統
- Header 小鈴鐺即時顯示未讀數量，管理員發送通知或商品上架時同步刷新
- 會員通知中心、後台通知發送頁面
- 相關檔案：[`NotificationView.vue`](src/views/NotificationView.vue)、[`stores/notification.js`](src/stores/notification.js)、[`AdminNotificationView.vue`](src/views/Admin/AdminNotificationView.vue)

### 5. 後台管理員 / 會員管理
- 管理員列表（新增 / 編輯 / 刪除 / 已刪除名單）、會員列表與搜尋
- 後台側邊欄收合
- 相關檔案：[`AdminSettingsView.vue`](src/views/Admin/AdminSettingsView.vue)、[`AdminMemberView.vue`](src/views/Admin/AdminMemberView.vue)、[`AdminDeletedView.vue`](src/views/Admin/AdminDeletedView.vue)

### 6. 其他
- 商品搜尋（含小分類）、Header 版面與導覽

## 本機執行

**需求**：Node.js 20+、已啟動的[後端 API](https://github.com/jaxieli0506/fatcat-mall-api)（預設 `https://localhost:7017`）

```bash
npm install
cp .env.example .env.local   # 填入第三方登入的 App ID / Client ID
npm run dev                  # http://localhost:5180
```

## 團隊成員

| 代號 | 成員 | 前端負責範圍 |
|---|---|---|
| jj | **佳馨（本人）** | 會員登入與第三方登入、會員中心、地址與超商門市、通知、後台管理員 / 會員管理、Git 整合 |
| rr | 如謙 | 收藏、活動、客訴進度追蹤、直播、線上客服 |
| yy | 玥彤 | 商品列表 |
| zz | 梓瑋 | 購物車、結帳 |

> 本 repo 為團隊專題最終版本（`dev` 分支）的整理版；原始團隊 repo 為私人。
