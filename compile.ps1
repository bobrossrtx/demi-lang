# Check if Deno is installed
if (!(Test-Path -Path "C:\Users\$env:USERNAME\.deno")) {
    # If Deno is not installed, install it
    Write-Host "Deno is not installed. Installing Deno..."
    Invoke-RestMethod https://deno.land/install.ps1 | Invoke-Expression
    Write-Host "Deno has been installed!"
}

# If no parameters are passed, print the help message
if ($args.Length -eq 0) {
    Write-Host "Usage: compile [windows|linux|macos|all]"
    exit
} else {
    $platform = $args[0]
}

# Create a new directory for the build output if it doesn't exist
if (!(Test-Path -Path "build")) {
    New-Item -ItemType Directory -Path "build"
}

# Compile the project

# variable 
$srcdir = "./src"

# Windows:
if ($platform -eq "windows") {
    # remove the old build if it exists
    if (Test-Path -Path ".\build\windows") {
        Remove-Item -Recurse -Force ".\build\windows"
    }
    $compileflags = "x86_64-pc-windows-msvc"
}
# Linux:
if ($platform -eq "linux") {
    # remove the old build if it exists
    if (Test-Path -Path "./build/linux") {
        Remove-Item -Recurse -Force "./build/linux"
    }
    $compileflags = "x86_64-unknown-linux-gnu"
}
# MacOS:
if ($platform -eq "macos") {
    # remove the old build if it exists
    if (Test-Path -Path "./build/macos") {
        Remove-Item -Recurse -Force "./build/macos"
    }
    $compileflags = "x86_64-apple-darwin"
}
# All:
if ($platform -eq "all") {
    # remove the old builds if it exists
    if (Test-Path -Path ".\build\windows") {
        Remove-Item -Recurse -Force ".\build\windows"
    }
    if (Test-Path -Path "./build/linux") {
        Remove-Item -Recurse -Force "./build/linux"
    }
    if (Test-Path -Path "./build/macos") {
        Remove-Item -Recurse -Force "./build/macos"
    }

    deno compile --allow-all --target x86_64-pc-windows-msvc -o ./build/windows/demi.exe $srcdir/main.ts

    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "stop"
    try {
        if (Get-Command "rcedit") {
            rcedit.exe ./build/windows/demi.exe --set-icon ./images/demi.ico
        }
    } catch {
        "RCedit isn't found within your system path, please add it or install it to change Demi's executable icon"
    } $ErrorActionPreference = $oldPreference

    deno compile --allow-all --target x86_64-unknown-linux-gnu -o ./build/linux/demi $srcdir/main.ts
    deno compile --allow-all --target x86_64-apple-darwin -o ./build/macos/demi $srcdir/main.ts
    Write-Host "Compilation Complete!" -ForegroundColor Green
    exit 0
}

# Compile the project
deno compile --allow-all --target $compileflags -o ./build/$platform/demi.exe $srcdir/main.ts
# ^^^^ THIS IS EXACTLY THE SAME AS WHAT I RUN IN TERMINAL



if ($platform -eq "windows") {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "stop"
    try {
        if (Get-Command "rcedit") {
            rcedit.exe ./build/windows/demi.exe --set-icon ./images/demi.ico
        }
    } catch {
        "RCedit isn't found within your system path, please add it or install it to change Demi's executable icon"
    } $ErrorActionPreference = $oldPreference
}

# Print Completion Message in Green
Write-Host "Compilation Complete!" -ForegroundColor Green
exit 0
