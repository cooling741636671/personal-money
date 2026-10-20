# 家庭收支报表

每月给家人汇报工资花到哪里了：在网页里填写收入与支出，自动算出结余，一键导出图片发送。

- **在线访问**：https://cooling741636671.github.io/personal-money/
- **仓库地址**：https://github.com/cooling741636671/personal-money

---

## 能做什么

- 填写本月实发工资、上月结转
- 动态添加 / 删除支出明细（类别、项目、金额、备注）
- 自动计算：可支配总额、合计支出、结余
- 生成「零花钱提醒」文案
- 一键导出 PNG 图片
- 数据可保存在本机浏览器（`localStorage`）

纯前端实现，无需后端服务器。

---

## 本地使用

1. 用浏览器打开 `index.html`，或双击 `打开报表.bat`
2. 左侧编辑数据，右侧实时预览
3. 点击「导出图片」保存 PNG
4. 需要时点「保存到浏览器」，下次打开可恢复

---

## 在线使用

打开：

https://cooling741636671.github.io/personal-money/

由 **GitHub Pages** 免费托管。改代码后推送到 `main` 分支，网站会自动更新。

如何用 GitHub 把静态网页变成可访问网站，见：

📄 [docs/GitHub网站访问手册.md](./docs/GitHub网站访问手册.md)

---

## 项目结构

```text
personal_money/
├── index.html                 # 页面
├── style.css                  # 样式
├── app.js                     # 逻辑（编辑 / 计算 / 导出）
├── 打开报表.bat               # Windows 快捷打开
├── vercel.json                # （可选）其它静态托管配置
├── docs/
│   └── GitHub网站访问手册.md  # GitHub Pages 上线手册
└── README.md
```

---

## 技术说明

| 项 | 说明 |
|----|------|
| 技术栈 | HTML + CSS + JavaScript |
| 导出图片 | [html2canvas](https://html2canvas.hertzen.com/)（CDN） |
| 数据存储 | 浏览器 `localStorage`（仅当前设备） |
| 部署 | GitHub Pages（`main` 分支根目录） |

示例数据为虚构演示数字，请勿提交真实账单到公开仓库。

---

## 更新网站

```bash
git add .
git commit -m "说明本次修改"
git push origin main
```

稍等 1～3 分钟后刷新在线地址即可。

---

## 许可证

个人使用。可按需自行修改。
