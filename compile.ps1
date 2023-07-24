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

# Windows:
if ($platform -eq "windows") {
    # remove the old build if it exists
    if (Test-Path -Path ".\build\windows") {
        Remove-Item -Recurse -Force ".\build\windows"
    }

    deno compile --allow-all --target x86_64-pc-windows-msvc -o .\build\windows\demi.exe .\main.ts
}
# Linux:
if ($platform -eq "linux") {
    # remove the old build if it exists
    if (Test-Path -Path "./build/linux") {
        Remove-Item -Recurse -Force "./build/linux"
    }

    deno compile --allow-all --target x86_64-unknown-linux-gnu -o ./build/linux/demi .\main.ts
}
# MacOS:
if ($platform -eq "macos") {
    # remove the old build if it exists
    if (Test-Path -Path "./build/macos") {
        Remove-Item -Recurse -Force "./build/macos"
    }

    deno compile --allow-all --target x86_64-apple-darwin -o ./build/macos/demi .\main.ts
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

    deno compile --allow-all --target x86_64-pc-windows-msvc -o .\build\windows\demi.exe .\main.ts
    deno compile --allow-all --target x86_64-unknown-linux-gnu -o ./build/linux/demi .\main.ts
    deno compile --allow-all --target x86_64-apple-darwin -o ./build/macos/demi .\main.ts
}

# Print Completion Message in Green
Write-Host "Compilation Complete!" -ForegroundColor Green