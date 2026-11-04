# 生成酒馆助手导入 JSON
#
# 真正的构建逻辑在 scripts/build.mjs（GitHub Actions 里跑的就是它）：
#   src/*.js  →  moon-phase.js  →  Galgame攻略系统-酒馆助手导入.json
#
# 这个 ps1 只是给习惯在 Windows 上运行的维护者留一个入口，不再自己拼 JSON，
# 免得出现「两套规则各写一份」的情况。

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$buildScript = Join-Path $PSScriptRoot 'build.mjs'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "需要先安装 Node.js（https://nodejs.org），然后在仓库根目录运行：node scripts/build.mjs"
}

Push-Location $repoRoot
try {
    & node $buildScript
    if ($LASTEXITCODE -ne 0) { throw "构建失败（退出码 $LASTEXITCODE）" }
} finally {
    Pop-Location
}
