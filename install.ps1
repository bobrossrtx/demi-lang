$gitinstalled="false"

$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "stop"
try {
    if (Get-Command "git") {
        $gitinstalled="true"
    }
} catch {
    Write-Host "Git isn't installed, please install it!" -ForegroundColor Red
    exit 1
} $ErrorActionPreference = $oldPreference


$ostype="x86_64-pc-windows-msvc"
$installdir="C:\Users\$env:USERNAME\.demi"
$bindir="$installdir/bin"
$tempdir="C:\Users\$env:USERNAME\AppData\Local\Temp"

$sourcecodelink="https://github.com/bobrossrtx/demi-lang.git"

# Check if Deno is installed
if (!(Test-Path -Path "C:\Users\$env:USERNAME\.deno")) {
    # If Deno is not installed, install it
    Write-Host "Deno is not installed. Installing Deno..."
    Invoke-RestMethod https://deno.land/install.ps1 | Invoke-Expression
    Write-Host "Deno has been installed!"
}

# Create the directory that contains the installation
# installdir
if (!(Test-Path -Path "$installdir")) {
    mkdir $installdir
    mkdir $bindir
}

git clone --recursive $sourcecodelink $tempdir/demi

deno compile --allow-all --target $compileflags -o ./build/$platform/demi.exe $srcdir/main.ts
