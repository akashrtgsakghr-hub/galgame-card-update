/* ═══ 攻略数据 / GUIDE ══════════════════════════════════════════════════════
   一份「卡关急救手册」，不是什么都要写全的百科。

   写这份东西的取舍：
   - 只写「走不过去的那一步」。城镇里有什么商店、路边有什么道具，游戏里自己会看，
     写进来只会让玩家滚得更久。
   - 路线按丰缘的主干写（八枚徽章的顺序、哪条路要哪种秘传机）。这个改版架在
     绿宝石的骨架上，骨架不会动；它改的是等级、精灵、道具位置，所以等级只给个
     区间并标明是参考，不给死数字。
   - 不确定的地方宁可说「把每间屋子都问一遍」，也不编一个具体 NPC 当答案。
   - 「卡关急救」那一段才是主体：九成的卡关都是同一个原因——前面有个东西没拿到。
     教会玩家问对问题，比背一张地图有用。
   ══════════════════════════════════════════════════════════════════════════════ */
var GUIDE_BOOK = [
  {
    id: 'b0', chip: '1 岩石', title: '未白镇 → 卡那兹市',
    lv: '全队 12–16（原版参考，改版通常更高）',
    goal: '先把「能砍树」和「球和药够用」两件事办掉，再进岩石道馆。',
    blocks: [
      { h: '怎么走', list: [
        '未白镇：选御三家，先在门口草丛打两三只，把等级顶到 8 以上。',
        '101 号道路 → 古辰镇：商店买 5 个精灵球、3 瓶伤药。',
        '102 号道路 → 橙华市：爸爸的道馆现在还打不了，只是过路；往左走 104。',
        '104 号道路 → 橙华森林：有人被抢，帮他打回去，拿回文件。',
        '卡那兹市：道馆（岩石）；打完再去城里最高的那栋楼交任务。'
      ] },
      { h: '钥匙', list: [
        '树挡路 = 缺「居合斩」（HM01）。这招就在卡那兹市一带，别急着往北走，把城里每间屋子都问一遍。',
        '岩石怕 水 / 草 / 格斗：御三家选水或草，这一枚最省事。'
      ] },
      { h: '卡在这', list: [
        '森林出口走不出去：先把挡在出口的喽啰打掉，再往右。',
        '道馆连输：御三家练到 14 级，或去 116 号道路刷两只再回来。',
        'NPC 说了什么记不住：对话里出现的地名，就是下一个目标。'
      ] }
    ]
  },
  {
    id: 'b1', chip: '2 格斗', title: '武斗镇 · 第二枚',
    lv: '16–20',
    goal: '救回老爷爷的鸟，搭他的船去武斗镇，打完再去洞里送信。',
    blocks: [
      { h: '怎么走', list: [
        '卡那兹市 → 116 号道路：隧道口有位老爷爷，他的鸟被抢了，帮忙打回来。',
        '他会开船。先去武斗镇（格斗道馆），再办别的事。',
        '武斗镇：道馆（格斗）；镇子北边有洞窟，把信交给里面的人。',
        '办完他送你去凯那市——下一段从那里开始。'
      ] },
      { h: '钥匙', list: [
        '洞窟里很黑：有「闪光」（HM05）看得清，没有也能摸黑走，只是慢。',
        '格斗怕 飞行 / 超能。'
      ] },
      { h: '卡在这', list: [
        '找不到船：老爷爷在 116 号道路靠海那间屋子，先把他那只鸟救回来。',
        '洞窟绕不出去：贴着墙一直往一个方向走，比乱转快。'
      ] }
    ]
  },
  {
    id: 'b2', chip: '3 电', title: '紫堇市 · 第三枚',
    lv: '20–24',
    goal: '在凯那市把货交掉，然后沿 110 号道路北上紫堇市。',
    blocks: [
      { h: '怎么走', list: [
        '凯那市：把「得文的货」交给博物馆门口的人，剧情才会往下走。',
        '110 号道路 → 紫堇市（沿路有自行车道，可走可不走）。',
        '紫堇市：道馆（电）。'
      ] },
      { h: '钥匙', list: [
        '「碎岩」（HM06）在紫堇市一带拿，之后很多路口要用。',
        '电系怕 地面：这个阶段抓一只地面系，比堆等级快得多。'
      ] },
      { h: '卡在这', list: [
        '道馆里的开关：三道要按顺序踩，踩错会重置，慢一点踩。',
        '打不过电系：地面系宝可梦 + 地面招式，两下就过。'
      ] }
    ]
  },
  {
    id: 'b3', chip: '4 火', title: '釜炎镇 · 第四枚',
    lv: '24–28',
    goal: '沿 111 / 112 号道路北上，坐缆车上烟突山，办完事下山进镇。',
    blocks: [
      { h: '怎么走', list: [
        '紫堇市往北 → 111 号道路（左边是沙漠，会刮沙暴）。',
        '112 号道路中段有缆车站，坐上去到烟突山。',
        '山顶先处理反派事件，再下山进釜炎镇。',
        '釜炎镇：道馆（火）。'
      ] },
      { h: '钥匙', list: [
        '沙暴里每回合掉血：带够伤药，或者干脆绕开沙漠走大路。',
        '火怕 水 / 岩石 / 地面。'
      ] },
      { h: '卡在这', list: [
        '找不到缆车站：在 112 号道路中段，有人守着，跟他说话。',
        '山顶卡住：先把山上的反派打退，路才会开。'
      ] }
    ]
  },
  {
    id: 'b4', chip: '5 普通', title: '橙华市 · 第五枚',
    lv: '28–32',
    goal: '回橙华市打爸爸的道馆——他要你先有四枚徽章。',
    blocks: [
      { h: '怎么走', list: [
        '从釜炎镇原路回紫堇市 → 110 → 凯那 → 卡那兹 → 橙华市。',
        '橙华市：道馆（普通），馆主是你爸。',
        '打完这里拿到「冲浪」（HM03）——整局的分水岭。'
      ] },
      { h: '钥匙', list: [
        '普通系没有弱点，靠等级和格斗招式硬打。',
        '冲浪到手后所有水面都能过，地图一下子打开。'
      ] },
      { h: '卡在这', list: [
        '道馆门不开：数一遍徽章，不够 4 枚他不理你。',
        '那只很肉的请假王：先用威吓或降攻击的招式，再打。'
      ] }
    ]
  },
  {
    id: 'b5', chip: '6 飞行', title: '茵郁市 · 第六枚',
    lv: '32–36',
    goal: '有冲浪之后往东走，过河到茵郁市。',
    blocks: [
      { h: '怎么走', list: [
        '紫堇市往东 → 118 号道路 → 冲浪过河 → 119 号道路（高草丛）。',
        '119 号道路上有剧情拦路，先处理掉。',
        '茵郁市：道馆（飞行）。'
      ] },
      { h: '钥匙', list: [
        '冲浪要在队伍里，而且那只宝可梦得能学——不能学就换一只。',
        '飞行怕 电 / 岩石 / 冰。'
      ] },
      { h: '卡在这', list: [
        '过不了河：确认队伍里有会冲浪的，站到水边按 A。',
        '道馆里的门是单向的：走错会绕回入口，一次走到底别回头。'
      ] }
    ]
  },
  {
    id: 'b6', chip: '7 超能', title: '绿岭市 · 第七枚',
    lv: '36–40',
    goal: '从茵郁市往南到海边，打完双打道馆，顺手把潜水拿到。',
    blocks: [
      { h: '怎么走', list: [
        '茵郁市往南 → 120 → 121 号道路 → 绿岭市。',
        '绿岭市：道馆（超能，双打）。',
        '这附近的剧情会给「潜水」（HM08），下一段要用。'
      ] },
      { h: '钥匙', list: [
        '超能怕 恶 / 幽灵 / 虫；双打是两个一起打，别只顾一边。',
        '带两只会恶系招式的，比带一只等级高的管用。'
      ] },
      { h: '卡在这', list: [
        '道馆地面是滑冰：一次滑到底，先想好角度再动。',
        '双打老输：先把血少的那个秒掉，剩下的就好办。'
      ] }
    ]
  },
  {
    id: 'b7', chip: '8 水', title: '琉璃市 · 第八枚',
    lv: '40–45',
    goal: '潜水过去，打最后一枚徽章。',
    blocks: [
      { h: '怎么走', list: [
        '绿岭市往东下水 → 126 号水路 → 潜水下去 → 从水下洞口进琉璃市。',
        '琉璃市：道馆（水）。'
      ] },
      { h: '钥匙', list: [
        '「潜水」+「冲浪」是这条路的钥匙，两样都要在队伍里。',
        '水怕 电 / 草。'
      ] },
      { h: '卡在这', list: [
        '找不到琉璃市：不是从水面走，要先潜到水下找洞口。',
        '道馆的冰面：踩一块碎一块，先看全图再走。'
      ] }
    ]
  },
  {
    id: 'b8', chip: '联盟', title: '彩幽市 · 四天王与冠军',
    lv: '48 以上，补给买满再进',
    goal: '走冠军之路进联盟，五连战一次打完，中途只能靠道具回血。',
    blocks: [
      { h: '怎么走', list: [
        '琉璃市往西 → 128 号水路 → 彩幽市。',
        '冠军之路：要「怪力」（HM04）推石头，路上还会用到碎岩、冲浪、攀瀑。',
        '进了联盟就是四天王 → 冠军，中间不能回商店。'
      ] },
      { h: '钥匙', list: [
        '四天王的属性顺序是 恶 → 幽灵 → 冰 → 龙，冠军是 水。',
        '出发前：复活、全恢复、PP 恢复都买满，等级统一到 48 以上。'
      ] },
      { h: '卡在这', list: [
        '冠军之路走不出去：多半是石头没推，回头找怪力能推的那块。',
        '打到一半没药：联盟门口有商店，进去之前先补，别硬撑。'
      ] }
    ]
  }
];

var GUIDE_EXTRA = [
  {
    id: 'help', chip: '卡关急救', title: '卡住了？照这四条问自己',
    lv: '不用背地图，问对问题就能走',
    goal: '九成的「卡关」都是同一件事：前面有个东西你没拿到。',
    blocks: [
      { h: '一、路被挡住了', list: [
        '挡路的是树 → 缺「居合斩」；是石头 → 缺「碎岩」或「怪力」；是水 → 缺「冲浪 / 潜水 / 攀瀑」。',
        '挡路的是人 → 先跟他说话；说完还不让走，就是前面的剧情没做完。',
        '都不是 → 回上一个城镇，把没进过的屋子全进一遍。'
      ] },
      { h: '二、打不过', list: [
        '等级差 5 级以上先练级；属性克制比等级更管用。',
        '药买满再进门，别省；PP 恢复比伤药更容易忘。',
        '还是打不过：换一只打，别硬练一只。'
      ] },
      { h: '三、不知道该干什么', list: [
        'NPC 嘴里出现的地名，就是下一个目标。',
        '看地图：还有没去过的城镇、没走过的水路，就是那里。',
        '实在想不起来：翻聊天记录，游戏存档跟着这条聊天走。'
      ] },
      { h: '四、想直接过', list: [
        'START → 第二项（名字是乱码的那条）是改版自带的修改器，能改等级、道具、金钱。',
        '屏里的金手指接口不写内存，开了也不生效——要无敌就用修改器。'
      ] }
    ]
  },
  {
    id: 'sys', chip: '这台机器', title: '按键、存档、修改器',
    lv: '三分钟看完，之后不用再翻',
    goal: '这台掌机怎么操作、存档在哪、无敌怎么开。',
    blocks: [
      { h: '按键', list: [
        '方向键移动，A 确认 / 说话，B 取消（按住是跑步）。',
        'START 开游戏菜单，SELECT 是功能键。',
        '键盘也行：方向键 / Z X / Enter Shift。'
      ] },
      { h: '存档', list: [
        '游戏内存档：START → 存档，存在这台机器的卡带里。',
        '「导出存档」会把 128KB 存档抓出来，跟着聊天记录走，换设备也能接着玩。',
        '面板关掉再打开不会丢，只有换聊天才会换一份存档。'
      ] },
      { h: '修改器（无敌）', list: [
        'START → 第二项。条目名是乱码，那是改版字库缺字，不是模拟器坏了。',
        '里面有等级、道具、金钱，改完直接生效。',
        '这是改版自带的，不是我们做的，所以它只在这版卡带里有。'
      ] },
      { h: '金手指', list: [
        '能粘 CBA / GSA 代码，但当前核心的接口不写内存。',
        '体检会如实告诉你「开不了」——不是不会用，是这个核心不行。',
        '要效果就用修改器，别在代码上浪费时间。'
      ] }
    ]
  }
];

var GUIDE_KEY = 'moon-pocket-guide-v1';
var guideState = { id: 'b0' };
var _guideAll = null;

function guideAll(){ if(!_guideAll) _guideAll = GUIDE_BOOK.concat(GUIDE_EXTRA); return _guideAll; }
function guideHas(id){ return guideAll().some(function(e){ return e.id === id; }); }
function guideFind(id){
  var hit = guideAll().filter(function(e){ return e.id === id; })[0];
  return hit || GUIDE_BOOK[0];
}
function guideLoad(){
  try{
    var raw = LS.getItem(GUIDE_KEY);
    if(!raw) return;
    var o = JSON.parse(raw);
    if(o && o.id && guideHas(o.id)) guideState.id = o.id;
  }catch(e){}
}
function guideSave(){
  try{ LS.setItem(GUIDE_KEY, JSON.stringify({ id: guideState.id })); }catch(e){}
}

/* 一段 → HTML。文案是纯数据，所以这里只负责套壳，不掺判断。 */
function guideEntryHtml(e){
  return '<div class="gd-entry">'
    + '<h3>' + esc(e.title) + '</h3>'
    + '<p class="gd-lv">等级参考 · ' + esc(e.lv) + '</p>'
    + '<p class="gd-goal">' + esc(e.goal) + '</p>'
    + e.blocks.map(function(b){
        return '<section class="gd-block"><h4>' + esc(b.h) + '</h4><ul>'
          + b.list.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('')
          + '</ul></section>';
      }).join('')
    + '</div>';
}

/* 搜索：把每段的标题、目标、每一条都摊平了搜。命中就整段列出来，
   因为「冲浪」这种词单看一行没用，得连上下文一起看。 */
function guideSearch(q){
  var key = String(q || '').trim().toLowerCase();
  if(!key) return null;
  var hits = [];
  guideAll().forEach(function(e){
    var lines = [e.title, e.goal, e.lv];
    e.blocks.forEach(function(b){ lines = lines.concat([b.h], b.list); });
    var matched = lines.filter(function(t){ return String(t).toLowerCase().indexOf(key) >= 0; });
    if(matched.length) hits.push({ e: e, matched: matched.slice(0, 3) });
  });
  return hits;
}

function guideRender(){
  var body = $('#guide-body'), tabs = $('#guide-tabs'), foot = $('#guide-foot');
  var box = $('#guide-q');
  var q = box ? box.value : '';
  var hits = guideSearch(q);

  if(tabs){
    tabs.innerHTML = guideAll().map(function(e){
      var on = (e.id === guideState.id && !hits) ? ' class="on"' : '';
      return '<button type="button" data-gd="' + esc(e.id) + '"' + on + '>' + esc(e.chip) + '</button>';
    }).join('');
  }
  if(!body) return;

  if(hits){
    body.innerHTML = hits.length
      ? '<p class="gd-hint">找到 ' + hits.length + ' 段 · 点一下跳过去</p>'
        + hits.map(function(h){
            return '<button type="button" class="gd-hit" data-gd="' + esc(h.e.id) + '">'
              + '<b>' + esc(h.e.title) + '</b>'
              + h.matched.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('')
              + '</button>';
          }).join('')
      : '<p class="gd-hint">没找到「' + esc(q) + '」。试试「冲浪 / 徽章 / 存档 / 修改器」。</p>';
  } else {
    body.innerHTML = guideEntryHtml(guideFind(guideState.id));
  }
  body.scrollTop = 0;
  if(foot){
    foot.textContent = LS.isPersistent
      ? '进度记在这台机器里 · 换聊天不会串'
      : '这台机器没给存储权限 · 进度只在本次有效';
  }
}

function guideOpen(id){
  var d = $('#guide-drawer');
  if(!d) return;
  if(id && guideHas(id)) guideState.id = id;
  d.hidden = false;
  var box = $('#guide-q'); if(box) box.value = '';
  guideRender();
  guideSave();
}
function guideClose(){
  var d = $('#guide-drawer');
  if(d) d.hidden = true;
}

/* 事件全部走委托：抽屉内容每次重画，直接绑按钮会越绑越多。 */
function guideBind(){
  var d = $('#guide-drawer');
  if(!d) return;

  d.addEventListener('click', function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var jump = t.closest('[data-gd]');
    if(jump){
      guideState.id = jump.getAttribute('data-gd');
      var box = $('#guide-q'); if(box) box.value = '';
      guideRender();
      guideSave();
      return;
    }
    if(t.closest('#guide-close')) guideClose();
  });

  var box = $('#guide-q');
  if(box) box.addEventListener('input', function(){ guideRender(); });

  ['#emu-guide', '#guide-btn'].forEach(function(sel){
    var b = $(sel);
    if(b) b.addEventListener('click', function(){ guideOpen(); });
  });

  /* Esc 关抽屉。用捕获阶段抢在宿主那套键位映射前面，
     否则按 Esc 会先被它当成「回卡带菜单」处理掉。 */
  addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    var drawer = $('#guide-drawer');
    if(!drawer || drawer.hidden) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    guideClose();
  }, true);
}

guideLoad();
guideBind();

window.POCKET_GUIDE = {
  open: guideOpen,
  close: guideClose,
  chapters: function(){ return guideAll().map(function(e){ return { id: e.id, chip: e.chip, title: e.title }; }); },
  current: function(){ return guideState.id; }
};
