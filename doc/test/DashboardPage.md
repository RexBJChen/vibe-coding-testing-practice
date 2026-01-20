> 狀態：初始為 [x]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：UI、Functionality、Integration、Logic

---

## [x] 【UI】驗證 Dashboard 基本資訊渲染
**範例輸入**：
1. 使用一般使用者 (User) 身份登入並進入 Dashboard

**期待輸出**：
1. 顯示標題「儀表板」
2. 顯示歡迎訊息「Welcome, [Username] 👋」
3. 顯示角色標籤
4. **不顯示**「管理後台」連結

---

## [x] 【UI】驗證 Admin 權限連結顯示
**範例輸入**：
1. 使用管理員 (Admin) 身份登入並進入 Dashboard

**期待輸出**：
顯示「管理後台」連結

---

## [x] 【Functionality】驗證登出功能
**範例輸入**：
1. 點擊「登出」按鈕

**期待輸出**：
1. `logout` 函式被呼叫
2. 導向至 `/login`

---

## [x] 【Integration】驗證商品列表載入成功
**範例輸入**：
1. 進入 Dashboard
2. 模擬 `productApi.getProducts` 回傳商品陣列

**期待輸出**：
1. 一開始顯示「載入商品中...」
2. 載入完成後顯示商品卡片
3. 商品卡片包含名稱、描述與價格

---

## [x] 【Integration】驗證商品列表載入失敗
**範例輸入**：
1. 進入 Dashboard
2. 模擬 `productApi.getProducts` 拋出錯誤 (非 401)

**期待輸出**：
1. 顯示錯誤訊息區塊
2. 顯示錯誤文字 content

---

## [ ] 【Logic】驗證 Token 過期 (401) 處理
**範例輸入**：
1. 進入 Dashboard
2. 模擬 `productApi.getProducts` 回傳 401 錯誤

**期待輸出**：
1. 捕捉到錯誤但不設定錯誤狀態 (交由 interceptor 處理)
2. 頁面可能仍維持在 loading 或顯示特定狀態 (視實作而定，依代碼邏輯是 return 掉，所以可能停在 loading 或維持原狀，這邊驗證不顯示錯誤訊息即可)
