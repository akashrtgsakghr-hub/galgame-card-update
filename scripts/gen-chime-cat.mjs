// 生成「小猫叫」提示音分片：repo-cache/src/87c-pocket-chime-cat.js
//   node scripts/gen-chime-cat.mjs
//
// 音源是卡带里喵喵（Meowth）的叫声 —— pokeemerald 的 GBA 原始采样，
// 8bit / 10512Hz / 448ms。工程里别的音频一个都没有（除宝可梦叫声），
// 这里把它转成浏览器能直接播的 16bit PCM，去直流 + 轻度低通 + 归一化 + 首尾淡入淡出，
// 最后 base64 内嵌进脚本。播放端用 AudioContext.decodeAudioData，失败就退回双音门铃。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const SRC_WAV = path.join(ROOT, 'pokeemerald', 'sound', 'direct_sound_samples', 'cries', 'meowth.wav');
const OUT = path.join(HERE, '..', 'src', '87c-pocket-chime-cat.js');

/* ── 读 8bit 单声道 PCM WAV ───────────────────────────────────────────── */
function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('不是 WAV');
  let p = 12, fmt = null, data = null;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4);
    const size = b.readUInt32LE(p + 4);
    const body = p + 8;
    if (id === 'fmt ') {
      fmt = {
        channels: b.readUInt16LE(body + 2),
        rate: b.readUInt32LE(body + 4),
        bits: b.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      data = b.subarray(body, body + size);
    }
    p = body + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('缺 fmt/data');
  if (fmt.bits !== 8 || fmt.channels !== 1) throw new Error('只处理 8bit 单声道，实际 ' + fmt.bits + 'bit/' + fmt.channels + 'ch');
  return { rate: fmt.rate, samples: data, };
}

/* ── 处理 ─────────────────────────────────────────────────────────────── */
const { rate, samples } = readWav(SRC_WAV);
const n = samples.length;
let x = new Float32Array(n);
let mean = 0;
for (let i = 0; i < n; i++) { x[i] = (samples[i] - 128) / 127; mean += x[i]; }
mean /= n;
for (let i = 0; i < n; i++) x[i] -= mean;              // 去直流：GBA 的 8bit 中心偏了会有低频嗡声

/* 一阶低通，截止 4.5kHz：削掉 8bit 量化噪声的高频「沙」，保留喵的共振峰 */
const fc = 4500;
const dt = 1 / rate;
const rc = 1 / (2 * Math.PI * fc);
const alpha = dt / (rc + dt);
for (let i = 1; i < n; i++) x[i] = x[i - 1] + alpha * (x[i] - x[i - 1]);

/* 首尾 6ms 淡入淡出，避免咔哒声 */
const fade = Math.min(Math.floor(rate * 0.006), Math.floor(n / 4));
for (let i = 0; i < fade; i++) {
  const k = i / fade;
  x[i] *= k;
  x[n - 1 - i] *= k;
}

/* 归一化到 0.92，留一点余量不削波 */
let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(x[i]));
const gain = peak > 0 ? 0.92 / peak : 1;
const pcm = Buffer.alloc(n * 2);
for (let i = 0; i < n; i++) {
  const v = Math.max(-1, Math.min(1, x[i] * gain));
  pcm.writeInt16LE(Math.round(v * 32767), i * 2);
}

/* ── 拼 16bit WAV ─────────────────────────────────────────────────────── */
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0, 'ascii');
hdr.writeUInt32LE(36 + pcm.length, 4);
hdr.write('WAVE', 8, 'ascii');
hdr.write('fmt ', 12, 'ascii');
hdr.writeUInt32LE(16, 16);
hdr.writeUInt16LE(1, 20);      // PCM
hdr.writeUInt16LE(1, 22);      // mono
hdr.writeUInt32LE(rate, 24);
hdr.writeUInt32LE(rate * 2, 28);
hdr.writeUInt16LE(2, 32);
hdr.writeUInt16LE(16, 34);
hdr.write('data', 36, 'ascii');
hdr.writeUInt32LE(pcm.length, 40);
const wav = Buffer.concat([hdr, pcm]);
const b64 = wav.toString('base64');

const js = `/* 87c-pocket-chime-cat.js —— 「AI 回完了」的那一声：小猫叫。
   音源是卡带里喵喵的 GBA 原始采样（pokeemerald/sound/direct_sound_samples/cries/meowth.wav，
   8bit / 10512Hz / 448ms），转成 16bit PCM 后 base64 内嵌在这里。
   要换音源就改 scripts/gen-chime-cat.mjs 重新生成，别手改这串 base64。

   为什么内嵌而不是读文件：掌机跑在 sandbox iframe 里，脚本本身是贴进酒馆的单文件，
   没有第二个资源文件可读；一段 450ms 的采样 base64 只有 ${Math.round(b64.length / 1024)}KB，
   比一次网络请求可靠得多。

   播放失败（旧浏览器 / 解码异常）时，87b 会自动退回原来的双音门铃，不会没声音。 */
var POCKET_CAT_B64 = '${b64}';
var POCKET_CAT_RATE = ${rate};
var POCKET_CAT_MS = ${Math.round((n / rate) * 1000)};
`;
fs.writeFileSync(OUT, js, 'utf8');
console.log('写出 ' + OUT);
console.log('  WAV ' + wav.length + ' 字节 / base64 ' + b64.length + ' 字符（' + (b64.length / 1024).toFixed(1) + 'KB）');
console.log('  ' + rate + 'Hz · ' + n + ' 采样 · ' + Math.round((n / rate) * 1000) + 'ms · 峰值归一化 x' + gain.toFixed(2));
