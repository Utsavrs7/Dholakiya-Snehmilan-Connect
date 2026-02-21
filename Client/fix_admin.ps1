$file = "c:\Users\Admin\OneDrive\Desktop\Snehmilan-Connect\Client\src\pages\Admin\SuperQuickActionsPage.jsx"
$content = Get-Content $file
# Lines to keep: 0 to 1901 (inclusive) and 1920 to end (inclusive)
# Lines to remove: 1902 to 1919 (18 lines total)
if ($content.Count -gt 2000) {
    $newContent = $content[0..1901] + $content[1920..($content.Count-1)]
    $newContent | Set-Content $file -Encoding UTF8 -Force
    Write-Host "File updated successfully."
} else {
    Write-Error "File content seems too short or already modified."
}
