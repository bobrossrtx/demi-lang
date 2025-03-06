#!/bin/bash

# Check if git is installed
if ! command -v deno &> /dev/null
then
    echo -e "\033[31mGit is not installed, please install it!\033[0m"
    exit 1
fi

# Check if deno is installed
if ! command -v deno &> /dev/null
then
    # Install deno
    echo -e "\033[33mDeno is not installed. Installing...\033[0m"
    curl -fsSL https://deno.land/x/install/install.sh | sh
fi

ostype=""
installdir="~/.demi"
bindir="$installdir/bin"
tempdir=""

sourcecodelink="https://github.com/bobrossrtx/demi-lang.git"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    ostype="x86_64-unknown-linux-gnu"
    tempdir="/tmp"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    ostype="x86_64-apple-darwin"
    tempdir="/tmp"
# elif [[ "$OSTYPE" == "cygwin" ]]; then
#         # POSIX compatibility layer and Linux environment emulation for Windows
elif [[ "$OSTYPE" == "msys" ]]; then
    ostype="x86_64-pc-windows-msvc"
    tempdir="~/AppData/Local/Temp"
elif [[ "$OSTYPE" == "win32" ]]; then
    ostype="x86_64-pc-windows-msvc"
    tempdir="~/AppData/Local/Temp"
# elif [[ "$OSTYPE" == "freebsd"* ]]; then
#     Not implemented yet by Deno
#     ostype="freebsd"
else
    ostype="unknown"
fi

# Create the directory that contains the installation
mkdir $installdir; mkdir $bindir;

# If os is unknown
if [ $ostype = "unknown" ]; then
then
    echo -e "\033[31mUnable to detect operating system type!\033[0m"
    exit 1
fi

# Install and compile
git clone --recursive $sourcecodelink $tempdir/demi
deno compile --allow-all --target $ostype -o "$bindir/demi" "$tempdir/demi/src/main.ts"

# Print Completion Message in Green
echo -e "\033[32mInstallation Complete!\033[0m"
exit 0