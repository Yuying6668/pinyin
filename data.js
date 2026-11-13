/* =========================================================
   拼音小飞机 · 课程数据（老师每周只需要改这个文件）
   ---------------------------------------------------------
   1. 每周上完课，在 WEEKS 里加一段（复制上一段改一改）。
   2. learn 里写这周新学的声母/韵母 —— 网站的拼音表、游戏、
      资源库会自动按进度“解锁”。
   3. files 里写这周的资料：['显示名字', 'res/文件夹/文件名.pdf']
   ========================================================= */

window.SITE = { title: '拼音小飞机', className: '拼音识字班B' };

window.WEEKS = [
  { date: '2026-08-22', title: '单韵母 a o e', learn: ['a', 'o', 'e'],
    points: ['认识 a o e 的样子和口形', '四个声调：一声平、二声扬、三声拐弯、四声降'],
    home: ['每天读一读 a o e 的四个声调，边读边用手比声调'] },
  { date: '2026-08-29', title: '单韵母 i u ü', learn: ['i', 'u', 'ü'],
    points: ['认识 i u ü，ü 有两个小点'],
    home: ['家长读，孩子指：玩“我说你指”'],
    files: [['拼音卡片 i u ü', 'res/0829/card-iuv.pdf'], ['涂色 i u ü', 'res/0829/coloring-iuv.pdf'],
      ['书写练习 i u ü', 'res/0829/practice-iuv.pdf'], ['控笔训练', 'res/0829/pencil.pdf']] },
  { date: '2026-09-05', title: '复习 a o e i u ü', learn: [],
    points: ['六个单韵母和四个声调'], home: ['在“拼音表”里点一点，听四个声调'],
    files: [['拼音卡片 a o e i u ü', 'res/0905/card-aoeiuv.pdf'], ['声调练习', 'res/0905/tone-aoeiuv.pdf'],
      ['涂色 a o e i u ü', 'res/0905/coloring-aoeiuv.pdf'], ['四线三格书写', 'res/0905/practice-sheet.pdf'],
      ['小青蛙练习页', 'res/0905/frog.pdf'], ['控笔练习 1', 'res/0905/pencil-1.pdf']] },
  { date: '2026-09-12', title: '声母 b p · 汉字“一”', learn: ['b', 'p'], hanzi: '一',
    points: ['b 像收音机，p 像捕虫网', '两拼：前音轻短后音重，两音相连猛一碰'],
    home: ['读 bā pá', '在“碰一碰”里试试 b、p 和单韵母拼'],
    files: [['作业：声调练习', 'res/0912/homework-tone.pdf'], ['拼音卡片 b p m f', 'res/0912/card-bpmf.pdf'],
      ['汉字“一”', 'res/0912/hanzi-yi.pdf'], ['控笔练习 2', 'res/0912/pencil-2.pdf']] },
  { date: '2026-09-19', title: '声母 m f · 田字格 · 汉字“一”', learn: ['m', 'f'], hanzi: '一',
    points: ['m 像两个门洞，f 像一根拐杖', '认识田字格'],
    home: ['读 mā fā mǐ fú'],
    files: [['作业', 'res/0919/homework.pdf'], ['控笔练习 3', 'res/0919/pencil-3.pdf']] },
  { date: '2026-09-26', title: '声母 d t · 汉字“二” · 中秋节', learn: ['d', 't'], hanzi: '二',
    points: ['d 像小鼓，t 像小伞', '羽毛实验：d 不送气，t 送气'],
    home: ['读 dà tù dì tā'],
    files: [['作业', 'res/0926/homework.pdf'], ['拼音卡片 d t n l', 'res/0926/card-dtnl.pdf'],
      ['汉字“二”', 'res/0926/hanzi-er.pdf'], ['带笔顺练字帖', 'res/0926/zitie.pdf'],
      ['拼音四线三格纸', 'res/0926/sixian.pdf'], ['田字格纸', 'res/0926/tianzige.pdf'], ['控笔练习 4', 'res/0926/pencil-4.pdf']] },
  { date: '2026-10-03', title: '声母 n l · 汉字“三”', learn: ['n', 'l'], hanzi: '三',
    points: ['n 像一个门洞，l 像一根小棍', '捏鼻子实验：n 鼻子里出声，l 不是', '小 ü 见了 n l，两点不能丢：nǚ lǜ'],
    home: ['读 nǐ lù nǚ lǜ'],
    files: [['作业', 'res/1003/homework.pdf'], ['汉字“三”', 'res/1003/hanzi-san.pdf'],
      ['国庆节练习', 'res/1003/guoqing.pdf'], ['控笔练习 5', 'res/1003/pencil-5.pdf']] },
  { date: '2026-10-10', title: '复习两拼音节 b p m f d t n l · 汉字“十”', learn: [], hanzi: '十',
    points: ['bā 八戒、mī 眯眼睛、lù 长颈鹿', 'b 和 d 分一分'],
    home: ['在“听音找飞机”里选 b p m f d t n l 练习'],
    files: [['作业', 'res/1010/homework.pdf'], ['汉字“十”', 'res/1010/hanzi-shi.pdf'], ['控笔练习 6', 'res/1010/pencil-6.pdf']] },
  { date: '2026-10-24', title: '声母 g k h · 汉字“人”', learn: ['g', 'k', 'h'], hanzi: '人',
    points: ['g 鸽子、k 蝌蚪、h 喝水', 'g k h 不和 i ü 做朋友', '三拼预告：guā（西瓜）'],
    home: ['读 gē kē hē，再说一个词'],
    files: [['作业', 'res/1024/homework.pdf'], ['拼音卡片 g k h', 'res/1024/card-gkh.pdf'],
      ['汉字“人”', 'res/1024/hanzi-ren.pdf'], ['控笔练习 7', 'res/1024/pencil-7.pdf']] },
  { date: '2026-10-31', title: '声母 j q x · ü 脱帽', learn: ['j', 'q', 'x'],
    points: ['j 一只公鸡、q 七个气球、x 切个西瓜', '魔法脱帽礼：小 ü 见了 j q x，去掉两点还读 ü'],
    home: ['读 jī qí xǐ jú qǔ xū'],
    files: [['作业', 'res/1031/homework.pdf'], ['拼音卡片 j q x', 'res/1031/card-jqx.pdf'],
      ['拼音汉字笔顺字帖', 'res/1031/zitie.pdf'], ['控笔练习 8', 'res/1031/pencil-8.pdf']] },
  { date: '2026-11-07', title: '复习 a o e i u ü + g k h j q x', learn: [],
    points: ['拼音飞行棋（gkhjqx 号航线）', '“碰一碰”骰子游戏', '拼音护照小检测'],
    home: ['拼音表贴在墙上，每天读一行', '在“碰一碰”里找出所有“不碰”的组合'],
    files: [['作业', 'res/1107/homework.pdf'], ['拼音表 g k h j q x', 'res/1107/pinyin-chart-gkhjqx.pdf'],
      ['拼音飞行棋游戏包', 'res/1107/feixingqi.pdf'], ['控笔练习 9', 'res/1107/pencil-9.pdf']] },
  { date: '2026-11-14', title: '复习 a o e i u ü + b p m f d t n l', learn: [],
    points: ['拼音飞行棋（bpmfdtnl 号航线）', 'b d p q 分一分', 'nǚ lǜ 和 jú qù 比一比'],
    home: ['读 bā mǐ dà tù nǚ lǜ'],
    files: [['拼音飞行棋游戏包', 'res/1114/feixingqi.pdf']] },
];

/* 资源库里“以后才用得上”的资料：needs 里的拼音全部学过才会亮起来。
   file 留空 = 只在老师电脑上，网站不提供下载。 */
window.LATER = [
  { title: '复韵母侦探小游戏', needs: ['ai', 'ei', 'ui'], note: '学完复韵母' },
  { title: '前后鼻韵母拼读飞行棋', needs: ['an', 'ang'], note: '学完前后鼻韵母' },
  { title: '整体认读音节分类小教具', needs: ['zhi', 'yi'], note: '学完整体认读音节' },
  { title: '拼音游戏 145 页复习课件', needs: ['zh', 'ai', 'an', 'yi'], note: '全部拼音学完后复习' },
  { title: '拼音小卡片 + 涂色（63 页）', needs: ['zh', 'ai', 'an'], note: '全部声母韵母学完' },
  { title: '拼音大富翁小游戏', needs: ['ai', 'an'], note: '学完复韵母和鼻韵母' },
];

window.INITIAL_GROUPS = [['b', 'p', 'm', 'f'], ['d', 't', 'n', 'l'], ['g', 'k', 'h'], ['j', 'q', 'x']];
window.FINALS = ['a', 'o', 'e', 'i', 'u', 'ü'];

/* 字母的记忆口诀（来自课件） */
window.LETTER = {
  b: ['📻', '像收音机'], p: ['🦋', '像捕虫网'], m: ['🚪', '像两个门洞'], f: ['🦯', '像一根拐杖'],
  d: ['🥁', '像小鼓'], t: ['☂️', '像小伞'], n: ['🚪', '像一个门洞'], l: ['🥢', '像一根小棍'],
  g: ['🕊️', '鸽子鸽子 g g g'], k: ['🐸', '蝌蚪蝌蚪 k k k'], h: ['🥤', '喝水喝水 h h h'],
  j: ['🐓', '一只公鸡 j j j'], q: ['🎈', '七个气球 q q q'], x: ['🍉', '切个西瓜 x x x'],
};
/* 声母呼读音（朗读单个声母用） */
window.INITIAL_SAY = { b: '玻', p: '坡', m: '摸', f: '佛', d: '得', t: '特', n: '讷', l: '勒',
  g: '哥', k: '科', h: '喝', j: '基', q: '欺', x: '希' };

/* 音节四个声调的朗读字（浏览器朗读用）。'' = 没有常用字。键名 v = ü */
window.SYL = {
  a: ['阿', '', '', ''], o: ['喔', '哦', '', ''], e: ['', '鹅', '', '饿'],
  i: ['衣', '姨', '椅', '意'], u: ['乌', '无', '五', '雾'], v: ['迂', '鱼', '雨', '玉'],
  ba: ['八', '拔', '把', '爸'], bo: ['波', '脖', '跛', ''], bi: ['逼', '鼻', '笔', '必'], bu: ['', '', '补', '布'],
  pa: ['趴', '爬', '', '怕'], po: ['坡', '婆', '叵', '破'], pi: ['批', '皮', '匹', '屁'], pu: ['扑', '葡', '普', '瀑'],
  ma: ['妈', '麻', '马', '骂'], mo: ['摸', '蘑', '', '墨'], mi: ['眯', '迷', '米', '蜜'], mu: ['', '', '母', '木'],
  fa: ['发', '罚', '法', ''], fo: ['', '佛', '', ''], fu: ['夫', '福', '斧', '复'],
  da: ['搭', '达', '打', '大'], de: ['', '德', '', ''], di: ['低', '笛', '底', '地'], du: ['嘟', '读', '赌', '度'],
  ta: ['他', '', '塔', '踏'], te: ['', '', '', '特'], ti: ['踢', '题', '体', '替'], tu: ['秃', '图', '土', '兔'],
  na: ['', '拿', '哪', '那'], ni: ['妮', '泥', '你', '腻'], nu: ['', '奴', '努', '怒'], nv: ['', '', '女', ''],
  la: ['拉', '', '喇', '辣'], le: ['', '', '', '乐'], li: ['', '梨', '李', '立'], lu: ['噜', '卢', '鲁', '鹿'], lv: ['', '驴', '旅', '绿'],
  ga: ['嘎', '', '', ''], ge: ['鸽', '格', '', '个'], gu: ['姑', '', '鼓', '故'],
  ka: ['咖', '', '卡', ''], ke: ['蝌', '咳', '可', '课'], ku: ['哭', '', '苦', '裤'],
  ha: ['哈', '', '', ''], he: ['喝', '荷', '', '贺'], hu: ['呼', '狐', '虎', '户'],
  ji: ['鸡', '急', '挤', '记'], jv: ['居', '橘', '举', '句'],
  qi: ['七', '骑', '起', '气'], qv: ['区', '渠', '取', '去'],
  xi: ['西', '习', '洗', '细'], xv: ['嘘', '徐', '许', '续'],
};

/* 拼音表弹出卡片里的例词和图片：[例词, 图片]
   图片默认用 emoji；想换成自己的图片，就把图片放进 img 文件夹，
   这里写 'img/文件名.png'。没有例词的声调只显示例字。 */
window.EX = {
  a1: ['阿姨', '👩', 'auntie'], o1: ['喔喔叫', '🐓', 'cock-a-doodle-doo'], e2: ['大白鹅', '🦢', 'white goose'], e4: ['饿了', '🍽️', 'hungry'],
  i1: ['衣服', '👕', 'clothes'], i2: ['阿姨', '👩', 'auntie'], i3: ['椅子', '🪑', 'chair'], i4: ['意大利面', '🍝', 'spaghetti'],
  u1: ['乌鸦', '🐦', 'crow'], u3: ['五个', '🖐️', 'five'], u4: ['大雾', '🌫️', 'thick fog'],
  v2: ['小鱼', '🐟', 'little fish'], v3: ['下雨', '🌧️', 'raining'], v4: ['玉米', '🌽', 'corn'],
  ba1: ['八戒', '🐷', 'Pigsy'], ba2: ['拔萝卜', '🥕', 'pull up a carrot'], ba3: ['一把伞', '☂️', 'an umbrella'], ba4: ['爸爸', '👨', 'dad'],
  bo1: ['波浪', '🌊', 'waves'], bo2: ['脖子', '🧣', 'neck'], bi2: ['鼻子', '👃', 'nose'], bi3: ['铅笔', '✏️', 'pencil'],
  bu3: ['补衣服', '🧵', 'mend clothes'], bu4: ['花布', '🧶', 'cloth'],
  pa1: ['趴下', '🐶', 'lie down'], pa2: ['爬山', '⛰️', 'climb a mountain'], pa4: ['害怕', '😨', 'scared'],
  po1: ['山坡', '⛰️', 'hillside'], po2: ['婆婆', '👵', 'grandma'], po4: ['破了', '💔', 'broken'],
  pi2: ['皮球', '⚽', 'ball'], pi3: ['一匹马', '🐎', 'a horse'],
  pu1: ['扑蝴蝶', '🦋', 'catch a butterfly'], pu2: ['葡萄', '🍇', 'grapes'], pu4: ['瀑布', '🏞️', 'waterfall'],
  ma1: ['妈妈', '👩', 'mum'], ma2: ['麻花', '🥨', 'twisted dough'], ma3: ['小马', '🐴', 'pony'],
  mo1: ['摸一摸', '🤚', 'touch'], mo2: ['蘑菇', '🍄', 'mushroom'], mo4: ['墨水', '🖋️', 'ink'],
  mi1: ['眯眼睛', '😑', 'squint'], mi2: ['迷路', '🧭', 'get lost'], mi3: ['米饭', '🍚', 'rice'], mi4: ['蜜蜂', '🐝', 'bee'],
  mu3: ['母鸡', '🐔', 'hen'], mu4: ['木头', '🪵', 'wood'],
  fa1: ['沙发', '🛋️', 'sofa'], fu2: ['福字', '🧧', '"fu" (luck) sign'], fu3: ['斧头', '🪓', 'axe'], fu4: ['复习', '📝', 'review'],
  da1: ['搭积木', '🧱', 'build blocks'], da3: ['打鼓', '🥁', 'play the drum'], da4: ['大象', '🐘', 'elephant'],
  di2: ['笛子', '🎶', 'flute'], di4: ['地球', '🌍', 'Earth'], du2: ['读书', '📖', 'read a book'],
  ta1: ['他', '👦', 'he'], ta3: ['铁塔', '🗼', 'iron tower'],
  ti1: ['踢球', '⚽', 'kick a ball'], ti3: ['体操', '🤸', 'gymnastics'],
  tu2: ['图画', '🖼️', 'picture'], tu3: ['泥土', '🪴', 'soil'], tu4: ['兔子', '🐰', 'rabbit'],
  na2: ['拿东西', '🤲', 'pick up things'], ni2: ['泥巴', '🟤', 'mud'], ni3: ['你好', '👋', 'hello'], nu3: ['努力', '💪', 'try hard'], nv3: ['女孩', '👧', 'girl'],
  la1: ['拉手', '🤝', 'hold hands'], la3: ['喇叭', '📯', 'trumpet'], la4: ['辣椒', '🌶️', 'chili pepper'], le4: ['快乐', '😄', 'happy'],
  li2: ['梨', '🍐', 'pear'], li3: ['李子', '🍑', 'plum'], li4: ['立正', '🧍', 'stand at attention'],
  lu4: ['长颈鹿', '🦒', 'giraffe'], lv2: ['小驴', '🫏', 'little donkey'], lv3: ['旅行', '🧳', 'travel'], lv4: ['绿色', '🟢', 'green'],
  ga1: ['鸭子嘎嘎', '🦆', 'quack quack'], ge1: ['鸽子', '🕊️', 'pigeon'], ge4: ['一个', '1️⃣', 'one'],
  gu1: ['姑姑', '👩', 'aunt'], gu3: ['打鼓', '🥁', 'play the drum'], gu4: ['故事', '📚', 'story'],
  ka1: ['咖啡', '☕', 'coffee'], ka3: ['卡片', '🃏', 'card'],
  ke1: ['蝌蚪', '🐸', 'tadpole'], ke2: ['咳嗽', '🤧', 'cough'], ke3: ['可乐', '🥤', 'cola'], ke4: ['上课', '🏫', 'class'],
  ku1: ['哭了', '😢', 'crying'], ku3: ['苦瓜', '🥒', 'bitter melon'], ku4: ['裤子', '👖', 'trousers'],
  ha1: ['哈哈笑', '😆', 'laugh'], he1: ['喝水', '🥤', 'drink water'], he2: ['荷花', '🪷', 'lotus'],
  hu2: ['狐狸', '🦊', 'fox'], hu3: ['老虎', '🐯', 'tiger'],
  ji1: ['公鸡', '🐓', 'rooster'], jv2: ['橘子', '🍊', 'tangerine'], jv3: ['举手', '🙋', 'raise a hand'],
  qi1: ['七个', '7️⃣', 'seven'], qi2: ['骑车', '🚲', 'ride a bike'], qi3: ['起床', '🛏️', 'get up'], qi4: ['气球', '🎈', 'balloon'],
  xi1: ['西瓜', '🍉', 'watermelon'], xi3: ['洗手', '🧼', 'wash hands'], xv1: ['嘘，小声', '🤫', 'shh, quiet'],
};

window.EXTRA_VALID = ['me', 'ne'];
