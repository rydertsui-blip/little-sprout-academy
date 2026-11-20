# 小芽学堂

一个给 iPad 使用的免费儿童学习网站，包含拼音、英语字母和首词、汉字笔顺描红，以及本地学习进度。

## 在线地址

部署后：<https://rydertsui-blip.github.io/little-sprout-academy/>

## 在 iPad 上使用

1. 用 Safari 打开上方网址。
2. 点分享按钮，再选“添加到主屏幕”。
3. 从主屏幕启动，学习记录会保存在这台 iPad 上。

网站使用 GitHub Pages 免费托管。它是静态网站，不需要服务器、数据库、信用卡或家长账号；页面资源和发音会缓存到设备，后续即使网络短暂中断也能继续学习。

## 内容

- 拼音：8 张带声调词语卡，含普通话录音。
- 英语：26 个字母、10 个首词，含英语录音。
- 汉字：12 个基础汉字，含笔顺动画、描红练习、拼音和普通话录音。
- 学习进度：本地保存，家长设置可调整朗读速度和每日目标。

## 本地运行

```bash
python3 -m http.server 4173 --directory outputs/little-sprout-academy
```

打开 <http://localhost:4173>。

## 第三方资源

见 `NOTICE.md` 与 `licenses/`。
