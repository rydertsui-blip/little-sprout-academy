# 小芽学堂

一个只面向 iPhone、iPad 和 Android 平板的儿童学习 PWA。没有桌面版，也没有原生 App 版；所有终端使用同一份 Web 程序。

家庭私用版自适应学习岛：<https://rydertsui-blip.github.io/little-sprout-academy/family/>

家庭版源码与内容说明见 [`apps/family/README.md`](./apps/family/README.md)。

## 在线地址

部署后：<https://rydertsui-blip.github.io/little-sprout-academy/>

## 安装与使用

iPhone / iPad：

1. 用 Safari 打开网址。
2. 点分享按钮，再选“添加到主屏幕”。
3. 从主屏幕启动。

Android 平板：

1. 用 Chrome 或 Edge 打开网址。
2. 点浏览器安装提示，或在菜单中选择“安装应用程式”。
3. 从主屏幕启动。

## 支援裝置

- iPhone：Safari + 加入主畫面。
- iPad：Safari + 加入主畫面。
- Android 平板：Chrome/Edge + 安裝 PWA。
- 不支援桌面、Android 手機和 App 內建瀏覽器。

完整約束見 [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md)。

网站使用 GitHub Pages 免费托管。它是静态网站，不需要服务器、数据库、信用卡或家长账号；页面资源和发音会缓存到设备，后续即使网络短暂中断也能继续学习。

## 内容

- 拼音：8 张带声调词语卡，含普通话录音。
- 英语：26 个字母、10 个首词，含英语录音。
- 汉字：以字卡、语音和配对游戏认读；不做打字、作文或手写评估。
- 学习进度：本地保存，家长设置可调整朗读速度和每日目标。

## 家庭学习版新增能力

- 内容包 `pilot-8` 带 228 道固定题、MOE PDF 来源 hash、逐页原文证据和 SHA-256 内容签名；内容或来源不一致时，生产构建会失败。
- 新增三对点击配对：点错可重试，三对完成才记录一次作答。
- 旧版汉字描画从孩子主入口隐藏，只保留旧学习数据兼容；核心学习改为点按、配對、聽音和口語遊戲。
- 孩子主页由小芽老师主动建议下一步，只有一个主要开始按钮。
- 家长看板新增每科「下一步建议」、近七天作答/独立答对/提示次数，以及逐题 CSV。
- 优先播放打包在站内的普通话和英语录音，录音缺失才回退系统语音。
- 学习内容仍标记为人工课纲复核待完成，不宣称已通过教师终审。

## 本地运行

```bash
python3 -m http.server 4173 --directory outputs/little-sprout-academy
```

打开 <http://localhost:4173>。

## 第三方资源

见 `NOTICE.md` 与 `licenses/`。
