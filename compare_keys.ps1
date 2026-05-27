$content = Get-Content 'C:\Users\rkala\stroke\src\app.jsx' -Raw

$match = [regex]::Match($content, 'const getDefaultTelestrokeNote = \(\) => \(\{([\s\S]*?)\n          \}\);')
$defaultFields = @()
if ($match.Success) {
    $block = $match.Groups[1].Value
    # Only match top-level fields (exactly 12 spaces indentation, not deeper nesting)
    $fieldMatches = [regex]::Matches($block, '^\s{12}(\w+)\s*:', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    foreach ($fm in $fieldMatches) {
        $defaultFields += $fm.Groups[1].Value
    }
}

$match2 = [regex]::Match($content, "sanitizeTelestrokeNoteForStorage[\s\S]*?const allowedKeys = \[([\s\S]*?)\];")
$allowedKeys = @()
if ($match2.Success) {
    $block2 = $match2.Groups[1].Value
    $keyMatches = [regex]::Matches($block2, "'(\w+)'")
    foreach ($km in $keyMatches) {
        $allowedKeys += $km.Groups[1].Value
    }
}

$defaultFields = $defaultFields | Sort-Object -Unique
$allowedKeys = $allowedKeys | Sort-Object -Unique

Write-Host "Default top-level fields: $($defaultFields.Count)"
Write-Host "Allowed storage keys: $($allowedKeys.Count)"
Write-Host ""

Write-Host "=== IN DEFAULT BUT NOT IN SANITIZER (true missing) ==="
$missing = $defaultFields | Where-Object { $allowedKeys -notcontains $_ }
$missing | ForEach-Object { Write-Host "  $_" }
Write-Host "Missing count: $($missing.Count)"

Write-Host ""
Write-Host "=== IN SANITIZER BUT NOT IN DEFAULT ==="
$extra = $allowedKeys | Where-Object { $defaultFields -notcontains $_ }
$extra | ForEach-Object { Write-Host "  $_" }
Write-Host "Extra count: $($extra.Count)"
