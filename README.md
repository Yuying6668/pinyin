# YY Chinese ✈️

拼音识字班B 的拼音课堂工具 + 家长练习网站。
网址：https://yuying6668.github.io/pinyin/

## 网站有什么

| 页面 | 用途 |
|---|---|
| 课堂工具 | 闪卡、随机分组、小组积分、拼音转盘、倒计时（上课投影用，右上角可以全屏） |
| 拼音游戏 | 拼音打地鼠（2–4 队）、碰一碰、听音找飞机（含“比一比”易混音）、拼音小邮差（把音节送到声母车站） |
| 拼音表 | 已学声母 × a o e i u ü；点音节弹出四个声调的例字、例词和图片 |
| 汉字卡 | 学过的汉字：笔顺动画、一笔一笔、在田字格里自己写；上/下、人/大 比一比 |
| 家长专区 | 每周学了什么、在家怎么练、作业下载 |
| 资源库 | 按周整理的打印资料；还没学到的资料显示为 🔒 |

整个网站会**按教学进度自动解锁**：只显示已经学过的拼音。

## 每周怎么更新（只改 `data.js`）

在 `WEEKS` 里复制上一周那一段，改成新的一周：

```js
{ date: '2026-11-21', title: '复韵母 ai ei ui', learn: ['ai', 'ei', 'ui'],
  points: ['课上做了什么'], home: ['在家怎么练'],
  files: [['作业', 'res/1121/homework.pdf']] },
```

- `learn` 写新学的拼音，拼音表和游戏会自动加上。
- 资料 PDF 放进 `res/日期/` 文件夹，在 `files` 里写上名字和路径。

## 两个入口，解锁方式不一样

- **老师用的主站** https://yuying6668.github.io/pinyin/ ：`data.js` 里写好的周全部解锁，包括还没上的课，方便备课。
- **家长用的拼音表** https://yuying6668.github.io/pinyin/biao.html ：按日期解锁，上完那节课才出现新拼音。
- 想看某一天家长看到的样子，在网址后面加 `?today=2026-11-28`。

## 汉字卡

- 每周在 `WEEKS` 里写 `hanzi: '大'`，汉字卡就会出现这个字（到了那天才解锁，前一周显示“下一次课”）。
- 拼音和笔画名称写在 `data.js` 的 `HANZI` 里，比如 `大: ['dà', ['横', '撇', '捺']]`。
- 笔顺动画的数据在 `lib/hanzi-data/`（已经放了 一 二 三 十 人 上 下 大 口 日 小 山 中 月 天 木 水 火 田）；其他字会自动从网上取。
- 想一对一对比较的字写在 `HANZI_PAIRS`。

## 换成自己的录音

还没录的 zh ch sh r 等音频，见 [`audio/待录音清单.md`](audio/待录音清单.md)。


1. 用手机录音，存成 mp3，命名：音节 + 声调数字，ü 写成 v
   （`ge1.mp3` = gē，`ju3.mp3` = jǔ，`lv4.mp3` = lǜ，声母呼读音 `letter-b.mp3`）。
2. 放进 `audio/` 文件夹。
3. 在 `audio/recorded.js` 里把文件名加进清单：`window.RECORDED = ['ge1', 'ju3'];`

有录音的音节播录音，其他的继续用浏览器朗读。

## 换成自己的图片

把图片放进 `img/`，在 `data.js` 的 `EX` 里把 emoji 换成路径，例如
`ge1: ['鸽子', 'img/gezi.png']`。

## 开源素材

- 笔顺动画：[Hanzi Writer](https://hanziwriter.org)（MIT，`lib/hanzi-writer-LICENSE.txt`），笔画数据来自 Make Me a Hanzi（Arphic Public License，`lib/hanzi-data/ARPHICPL.TXT`）。
- 卡通图：Microsoft Fluent Emoji（MIT）。

## 注意

这是公开网站：不要放孩子的名字、照片、考勤和学生名单。

> 改了 `data.js`、`app.js` 或 `style.css` 之后，把 `index.html` 里对应的 `?v=日期` 改成新的日期，家长手机上就会立刻看到新版本。
