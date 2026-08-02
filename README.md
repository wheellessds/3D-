# PROJECT ECHO

以 Three.js 製作的單人第一人稱劇情射擊遊戲。這個版本是一段可從主選單玩到結局的完整垂直切片，不需要下載模型或音效素材。

## 目前內容

- 第一人稱移動、跳躍、蹲下、奔跑與碰撞
- 手槍、突擊步槍、霰彈槍
- 射擊、後座、瞄準、換彈、彈藥與命中部位
- 巡邏、搜索、追擊與射擊敵人 AI
- 線性劇情任務、終端互動、檢查點與本機存檔
- 三段戰鬥、核心頭目、死亡重試與結算統計
- 程序生成場景、武器模型、敵人模型和 Web Audio 音效
- GitHub Pages 自動部署工作流程

## 操作

| 按鍵 | 功能 |
| --- | --- |
| WASD | 移動 |
| 滑鼠 | 視角 |
| 左鍵 | 射擊 |
| 右鍵 | 瞄準 |
| Shift | 奔跑 |
| Space | 跳躍 |
| Ctrl / C | 蹲下 |
| E | 互動 |
| R | 換彈 |
| 1 / 2 / 3 | 切換武器 |
| Esc | 暫停 |

## 本機啟動

瀏覽器的 ES Module 需要透過 HTTP 伺服器載入，不能直接雙擊 `index.html`。

```bash
python3 -m http.server 4173
```

接著開啟 `http://localhost:4173`。

## 發布

專案包含 `.github/workflows/deploy-pages.yml`。在 GitHub 儲存庫設定中，將 Pages 的 Source 設成 **GitHub Actions**，之後推送到 `main` 就會自動部署。

## 技術說明

目前直接透過 import map 載入 Three.js CDN，不需要 npm 安裝或建置。實際網站執行 `src/game.js` 與 `src/main.js`。