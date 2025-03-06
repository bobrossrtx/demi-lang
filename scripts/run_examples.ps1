$examplesDir = Resolve-Path "h:\demi-lang\examples"
$exampleFiles = Get-ChildItem -Path $examplesDir -Filter *.dem -Recurse | Where-Object {
    $_.FullName -notlike "*\games\*"
}

# Initialize counters and failure details
$total = 0
$successes = 0
$failures = 0
$failureDetails = @()

foreach ($file in $exampleFiles) {
    $total++
    $relativePath = $file.FullName.Substring($examplesDir.Path.Length + 1)
    $command = "deno run -A h:\demi-lang\src\main.ts $($file.FullName)"
    Write-Host "`nRunning example: $relativePath`n" -ForegroundColor Cyan
    try {
        # Capture the output of the command
        $output = Invoke-Expression $command 2>&1

        # Check if the output contains "Error"
        if ($output -match "Error") {
            Write-Host "[X] $relativePath failed with error." -ForegroundColor Red
            Write-Host $output -ForegroundColor DarkRed
            $failures++
            $failureDetails += @{
                Example = $relativePath
                Error = $output
            }
        } else {
            Write-Host "[/] $relativePath ran successfully." -ForegroundColor Green
            $successes++
        }
    }
    catch {
        Write-Host "[X] Error running $relativePath : $_" -ForegroundColor Red
        $failures++
        $failureDetails += @{
            Example = $relativePath
            Error = $_
        }
    }
}

# Summary Section
Write-Host "`n=== Summary ===" -ForegroundColor Yellow
Write-Host "Total Examples: $total"
Write-Host "Successful Runs: $successes" -ForegroundColor Green
Write-Host "Failed Runs: $failures" -ForegroundColor Red

if ($failures -gt 0) {
    Write-Host "`n=== Failure Details ===" -ForegroundColor Red
    foreach ($failure in $failureDetails) {
        Write-Host "- Example: $($failure.Example)" -ForegroundColor Red
        Write-Host "  Error: $($failure.Error)" -ForegroundColor DarkRed
    }
}

Read-Host "`nPress Enter to exit"