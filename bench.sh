#!/bin/bash
jsonoutput=""
jsonEnabled=""

if [ $# -eq 1 ]; then
    jsonEnabled=$1
fi

# Check if deno is installed
if ! command -v deno &> /dev/null
then
    # Install deno
    echo -e "\033[33mDeno is not installed. Installing...\033[0m"
    curl -fsSL https://deno.land/x/install/install.sh | sh
fi


if [ "$jsonEnabled" = "json" ]; then
    deno bench --allow-all --json > benchmark.json &
    deno bench --allow-all
elif [ "$jsonEnabled" = "json-only" ]; then
    deno bench --allow-all --json > benchmark.json &
else
    deno bench --allow-all
fi
