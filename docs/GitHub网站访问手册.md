# 通过 GitHub 实现网站访问手册

面向纯前端项目（HTML / CSS / JS），不需要自己买服务器、写后端，也能让别人用浏览器打开你的网站。

本手册以本项目「家庭收支报表」为例，地址：

- 仓库：https://github.com/cooling741636671/personal-money
- 网站：https://cooling741636671.github.io/personal-money/

---

## 1. 原理是什么？

GitHub 提供免费的 **GitHub Pages** 服务：

1. 把网站文件（如 `index.html`）放到 GitHub 仓库
2. 在仓库里打开 Pages 功能
3. GitHub 给你一个公网地址，浏览器即可访问

适合：个人主页、静态官网、小工具、报表页等。  
不适合：必须自己存数据库、要登录鉴权的复杂后台（那需要额外服务）。

本项目的数据存在访问者自己的浏览器（`localStorage`），所以**不需要后端**。

---

## 2. 你需要准备什么？

| 准备项 | 说明 |
|--------|------|
| GitHub 账号 | https://github.com 注册 |
| Git | 本机安装 Git（Windows 可装 Git for Windows） |
| GitHub CLI（可选） | 方便创建仓库、开 Pages：`winget install GitHub.cli` |
| 网络 | 国内访问 GitHub 有时需 VPN / 代理 |

> **安全提醒**：不要把账号密码发给别人或写进代码。登录用浏览器授权，或使用 Personal Access Token（PAT）。

---

## 3. 项目目录要长什么样？

静态站点最简结构：

```text
personal_money/
├── index.html      ← 首页（必须，Pages 默认找它）
├── style.css
├── app.js
└── .gitignore
```

注意：

- 首页文件名建议叫 `index.html`
- 资源用相对路径（如 `href="style.css"`），不要写成 `D:\...` 这种本地绝对路径
- 不要把 `.env`、密码、真实隐私数据提交进仓库

---

## 4. 第一次上线：完整步骤

### 步骤 A：本地初始化 Git

在项目目录打开终端：

```bash
git init -b main
git add .
git commit -m "Initial commit"
```

### 步骤 B：登录 GitHub

推荐用 GitHub CLI：

```bash
gh auth login
```

按提示选择：

- GitHub.com
- HTTPS
- 浏览器登录（Login with a web browser）

若 `gh` 因网络连不上，可用浏览器打开 https://github.com/login/device ，按 CLI 给的验证码授权。

### 步骤 C：创建远程仓库并推送

```bash
gh repo create personal-money --public --source=. --remote=origin --push
```

说明：

- `personal-money`：仓库名，可自定
- `--public`：公开仓库（免费 Pages 常用）
- 推送成功后仓库地址类似：  
  `https://github.com/<你的用户名>/personal-money`

也可用网页：GitHub → New repository → 创建后按页面提示关联本地并 `git push`。

### 步骤 D：开启 GitHub Pages

**方式一：网页操作**

1. 打开仓库 → **Settings**
2. 左侧 **Pages**
3. **Build and deployment** → Source 选 **Deploy from a branch**
4. Branch 选 `main`，文件夹选 `/ (root)`
5. 点 Save

**方式二：命令行**

```bash
gh api -X POST "repos/<你的用户名>/<仓库名>/pages" \
  -H "Accept: application/vnd.github+json" \
  -f "build_type=legacy" \
  -f "source[branch]=main" \
  -f "source[path]=/"
```

### 步骤 E：拿到访问地址

等待 1～3 分钟构建完成后，地址一般为：

```text
https://<你的用户名>.github.io/<仓库名>/
```

本项目即：

```text
https://cooling741636671.github.io/personal-money/
```

若打不开：

- 再等一两分钟（首次构建较慢）
- 打开仓库 **Settings → Pages** 看是否提示构建成功
- 确认仓库里根目录有 `index.html`
- 检查网络是否能访问 `*.github.io`

---

## 5. 以后怎么更新网站？

改完本地文件后：

```bash
git add .
git commit -m "说明这次改了什么"
git push origin main
```

推送成功后，Pages 会自动重新部署，稍等刷新即可。一般不用重新点 Settings。

---

## 6. 常用命令速查

```bash
# 查看登录状态
gh auth status

# 查看远程仓库
git remote -v

# 查看 Pages 状态
gh api "repos/<用户名>/<仓库名>/pages"
```

---

## 7. 地址规则说明

| 仓库类型 | 示例仓库名 | 访问地址 |
|----------|------------|----------|
| 普通项目仓库 | `personal-money` | `https://用户名.github.io/personal-money/` |
| 用户主页仓库 | `用户名.github.io` | `https://用户名.github.io/` |

本项目属于第一种（项目站），URL 末尾带仓库名。

---

## 8. 隐私与数据注意

1. **公开仓库**里的内容谁都能看，不要提交真实工资、账单、截图。
2. 本站用浏览器本地存储数据；换电脑 / 清缓存会丢，这是正常现象。
3. 示例数据请用虚构数字；改完后记得 `push`，否则网上仍是旧内容。
4. Git 历史里若曾提交过隐私，删除文件再 push 不够，历史仍可能留存；需要彻底清理时可另做处理。

---

## 9. 可选：绑定自己的域名

免费域名形如 `xxx.github.io`。若已有域名（如 `money.example.com`）：

1. 在域名服务商添加 CNAME，指向 `用户名.github.io`
2. 仓库 **Settings → Pages → Custom domain** 填入你的域名并保存
3. 按页面提示开启 HTTPS

---

## 10. 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 404 | Pages 未开或还在构建 | 检查 Settings → Pages，等待后刷新 |
| 打开是空的 / 样式丢失 | 路径写成了绝对路径 | 改成相对路径后重新 push |
| `git push` / `gh` 超时 | 网络访问 GitHub 不稳定 | 开稳定 VPN 后重试 |
| 改了代码网站没变 | 浏览器缓存或未 push | 强制刷新；确认 `git push` 成功 |
| 仍显示旧示例数据 | 浏览器 localStorage | 点「恢复示例」或清除该站点数据 |

---

## 11. 和本项目的对应关系

| 本地 | 线上 |
|------|------|
| `D:\just so so\my\personal_money` | GitHub 仓库 `personal-money` |
| 双击 `index.html` 本地预览 | 浏览器打开 `*.github.io/personal-money/` |
| `git push origin main` | 自动更新网站 |

---

## 12. 一句话总结

> 代码推到 GitHub 公开仓库 → 打开 Pages（main 分支根目录）→ 用 `https://用户名.github.io/仓库名/` 访问。

按本手册做一次后，以后只需改代码再 `push`，网站就会跟着更新。
