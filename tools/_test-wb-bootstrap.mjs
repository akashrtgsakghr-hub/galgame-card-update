/* 只测 A0c 的纯逻辑：世界书认人、取设定、掷骰、排除名单、删除。
   node tools/_test-wb-bootstrap.mjs */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src', 'A0c-wb-bootstrap.js');
const src = fs.readFileSync(SRC, 'utf8');

let store = {};
let state = { stat_data: { 世界: {}, 角色: { 林晚: { 好感度: 12, 肉体值: 0 }, 周雨: { 好感度: -4, 肉体值: 2 }, 空壳: {} } } };
const toasts = [];

globalThis.mainWin = {
  world_info: {
    '主世界书': {
      entries: {
        0: { comment: '林晚', key: ['林晚', '晚姐'], content: '林晚是玩家的学姐，性格冷静。她对他一直有戒心。' },
        1: { comment: '周雨 · 角色', key: ['周雨', '小雨'], content: '周雨的妹妹，活泼。她很喜欢跟着他跑。' },
        2: { comment: '魔法学院', key: ['魔法学院', '学院'], content: '这个世界里的学院设定，与角色无关。' },
        3: { comment: '地图', key: ['北境', '王城'], content: '地理设定。' },
        4: { comment: '陈澈', key: '陈澈,阿澈', content: '陈澈是玩家的旧友，两人有旧怨。' },
      }
    }
  }
};
globalThis.window = globalThis.window || {};
globalThis.getSTCtx = () => ({});
globalThis.readChatFeatureValue = (k, d) => (k in store ? store[k] : d);
globalThis.writeChatFeatureValue = (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); return true; };
globalThis.readMvuLatest = () => state;
globalThis.writeMvuLatest = async (sd) => { state = { stat_data: sd }; return true; };
globalThis.isCharSkeleton = (ch) => !ch || !(ch.好感度 !== undefined || ch.肉体值 !== undefined);
globalThis.getRStageFromE = (E) => ({ r: E >= 18 ? 1 : 0, name: E >= 18 ? '愿意认识' : '拒绝认识' });
globalThis.toast = (m, t) => toasts.push([t, m]);
globalThis.refreshPanel = () => {};
globalThis.mainDoc = { getElementById: () => null };
globalThis.lastWriteError = '';
globalThis.getCardMode = () => 'multi';
globalThis.getCurrentCardName = () => '某剧本合集';
let captured = null;
globalThis.showModalDialogCancelable = (title, html) => { captured = { title, html }; };
globalThis.showModalDialog = (title, html) => { captured = { title, html }; };
globalThis.applyMultiCardAdaptiveOpening = async () => {};
globalThis.collectCurrentPlayerPersona = () => ({ name: '林知', persona: '' });
globalThis.callOpeningModel = async () => '[]';
globalThis.showLoadingDialog = () => {};
globalThis.closeLoadingDialog = () => {};

const api = new Function(src + '\nreturn { openWorldbookBootstrapDialog, wbBooksRaw, wbCharacterCandidates, wbLoreForName, moonDiceOpening, isMoonCharBlocked, setMoonCharBlocked, deleteCharProfile, moonBlockedNames };')();

let failed = 0;
function assert(cond, msg) { if (!cond) { console.error('✗ ' + msg); failed++; } else console.log('✓ ' + msg); }

const books = api.wbBooksRaw();
assert(books.length === 1 && books[0].entries.length === 5, '世界书解析：1 本 5 条');

const cands = api.wbCharacterCandidates().map((c) => c.name);
console.log('   候选：' + cands.join('、'));
assert(cands.includes('林晚'), '认出 comment=人名（林晚）');
assert(cands.includes('周雨'), '认出 comment 带「· 角色」（周雨）');
assert(cands.includes('陈澈'), '认出字符串关键词（陈澈）');
assert(!cands.includes('魔法学院'), '不把「魔法学院」当角色');
assert(!cands.includes('地图') && !cands.includes('北境'), '不把设定条目当角色');

const lore = api.wbLoreForName('林晚', ['晚姐']);
assert(lore.includes('学姐') && lore.includes('戒心'), '按名字取到设定正文（只在需要时才取）');

const d = api.moonDiceOpening();
assert(d.E >= -30 && d.E <= 30 && /^🎲 \d\+\d=\d+/.test(d.text), '掷骰：2d6，区间 -30..30');

api.setMoonCharBlocked('周雨', true);
assert(api.isMoonCharBlocked('周雨'), '写进永久排除名单');
assert(!api.wbCharacterCandidates().map((c) => c.name).includes('周雨'), '排除名单里的人不再出现在候选');
api.setMoonCharBlocked('周雨', false);
await api.deleteCharProfile('周雨', false);
assert(!(state.stat_data.角色['周雨'] !== undefined && !globalThis.isCharSkeleton(state.stat_data.角色['周雨'])), '删除档案：从角色表里移掉');
assert(!api.isMoonCharBlocked('周雨'), '普通删除不影响排除名单');

await api.deleteCharProfile('林晚', true);
assert(api.isMoonCharBlocked('林晚'), '勾了永久 → 进排除名单');

api.setMoonCharBlocked('林晚', false);
assert(!api.isMoonCharBlocked('林晚'), '可以撤销排除');

state = { stat_data: { 世界: {}, 角色: { 林晚: { 好感度: 30, 肉体值: 0 }, 空壳: {} } } };
api.openWorldbookBootstrapDialog(null);
assert(!!captured, '能渲染建档弹窗');
const H = (captured && captured.html) || '';
assert(H.indexOf('林晚') >= 0 && H.indexOf('陈澈') >= 0, '弹窗里列出世界书角色');
assert(H.indexOf('魔法学院') < 0, '弹窗里没有设定词');
assert(H.indexOf('某剧本合集') < 0, '多人卡下卡名不出现在候选');
assert(H.indexOf('moon-wb-del') >= 0, '已有档案带删除按钮');
assert(H.indexOf('让 AI 判') >= 0 && H.indexOf('掷骰') >= 0 && H.indexOf('自己填') >= 0, '三种填法都在');

console.log(failed ? ('\n' + failed + ' 项失败') : '\n全部通过');
process.exit(failed ? 1 : 0);
