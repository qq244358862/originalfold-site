# 原始折叠 · Original Fold

成都原始折叠科技有限公司的公开网站。首页保留黑色三维折纸、联系区域和公司页脚；工作室介绍可从导航打开。联系：hello@tianmengdesign.com。

点「作品」或「浏览作品」，印有「想过」「段落计时器」的作品纸会从黑色折纸的当前折痕滑出。点作品卡可访问产品页。点「收起」、按 Esc 或使用浏览器后退都能收回作品纸。

- `index.html`：首页与两张原版作品卡。`#works` 可直接打开作品。
- `studio.html`：公司和工作室介绍。
- `style.css`：响应式排版、卡片插画与纸面样式。
- `fold.js`：三维折纸、拖动旋转。方向键旋转，Shift + 方向键平移，Home 复位。
- `portfolio.js`：按折纸当下位置展开和收起作品纸，含键盘、减少动态效果与深链接支持。
- `studio.js`：复制联系邮箱。`mark.svg`：品牌标志。

所有资源随仓库提供，无需构建。直接打开 `index.html`，或在此目录执行 `python -m http.server 8000`。GitHub Pages 使用 `main` 分支根目录。
