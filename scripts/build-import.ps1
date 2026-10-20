$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot 'moon-phase.js'
$outputPath = Join-Path $repoRoot 'Galgame攻略系统-酒馆助手导入.json'

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "找不到脚本源码：$sourcePath"
}

$scriptRecord = [ordered]@{
    type = 'script'
    enabled = $true
    name = 'Galgame攻略系统'
    id = 'e22f244b-70e1-448e-b24e-5a9b36c48484'
    content = [System.IO.File]::ReadAllText($sourcePath, [System.Text.Encoding]::UTF8)
    info = 'Galgame攻略系统 / 月相插件。导入后会自动运行，并在酒馆助手扩展菜单中显示入口。'
    button = [ordered]@{
        enabled = $false
        buttons = @()
    }
    data = @{}
}

$json = ConvertTo-Json -InputObject $scriptRecord -Depth 10
[System.IO.File]::WriteAllText($outputPath, $json, [System.Text.UTF8Encoding]::new($false))
Write-Output "已生成：$outputPath"
