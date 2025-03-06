$jsonoutput = ""
$jsonEnabled = ""

if ($args.Count -eq 1) {
    $jsonEnabled = $args[0]
}

# Check if Deno is installed
$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "stop"
try {
    if (Get-Command "deno") {
        # Deno is installed
    }
} catch {
    # Install deno
    Write-Host "Deno is not installed. Installing..." -ForegroundColor Yellow
    irm https://deno.land/install.ps1 | iex
} 
$ErrorActionPreference = $oldPreference

if ($jsonEnabled -eq "json") {
    Start-Process -NoNewWindow deno -ArgumentList "bench", "--allow-all", "--json" -RedirectStandardOutput "benchmark.json"
    deno bench --allow-all
} elseif ($jsonEnabled -eq "json-only") {
    Start-Process -NoNewWindow deno -ArgumentList "bench", "--allow-all", "--json" -RedirectStandardOutput "benchmark.json"
} else {
    deno bench --allow-all
}