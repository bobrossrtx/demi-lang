#!/bin/bash

# Check if deno is installed
if ! command -v deno &> /dev/null
then
    # Install deno
    echo -e "\033[33mDeno is not installed. Installing...\033[0m"
    curl -fsSL https://deno.land/x/install/install.sh | sh
fi

# If no parameters are passed, print the help message
if [ $# -eq 0 ]; then
    echo "Usage: compile [windows|linux|macos|all]"
    exit 1
else
    platform=$1
fi

# Create a new directory for the build output if it doesn't exist
if [ ! -d "build" ]; then
    mkdir "build"
fi

# Create vars
sourcedir="./src"
compileflags="--allow-all --target"

# Compile the project

# Windows:
if [ "$platform" = "windows" ]; then
    # remove the old build if it exists
    if [ -d "./build/windows" ]; then
        rm -rf "./build/windows"
    fi
    compileflags += " x86_64-pc-windows-msvc"
fi

# Linux:
if [ "$platform" = "linux" ]; then
    # remove the old build if it exists
    if [ -d "./build/linux" ]; then
        rm -rf "./build/linux"
    fi
    compileflags += " x86_64-unknown-linux-gnu"
fi

# MacOS:
if [ "$platform" = "macos" ]; then
    # remove the old build if it exists
    if [ -d "./build/macos" ]; then
        rm -rf "./build/macos"
    fi
    compileflags += " x86_64-apple-darwin"
fi

# All:
if [ "$platform" = "all" ]; then
    # # remove the old builds if it exists
    # if [ -d "./build/windows" ]; then
    #     rm -rf "./build/windows"
    # fi
    # if [ -d "./build/linux" ]; then
    #     rm -rf "./build/linux"
    # fi
    # if [ -d "./build/macos" ]; then
    #     rm -rf "./build/macos"
    # fi

    deno compile --allow-all --target x86_64-pc-windows-msvc -o "./build/windows/demi.exe" "./main.ts"
    deno compile --allow-all --target x86_64-unknown-linux-gnu -o "./build/linux/demi" "./main.ts"
    deno compile --allow-all --target x86_64-apple-darwin -o "./build/macos/demi" "./main.ts"
    echo -e "\033[32mCompilation Complete!\033[0m"
    exit
else
    deno compile $compileflags -o "./build/$platform/" "$sourcedir/main.ts"

    # Print Completion Message in Green
    echo -e "\033[32mCompilation Complete!\033[0m"
    exit 0
fi
