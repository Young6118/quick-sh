#!/bin/bash
# Description: Test script for validating argument passing in Shell

echo "=== Shell Arguments Test ==="
echo "Script name: $0"
echo "Arguments received: $*"
echo "Number of arguments: $#"

if [ $# -gt 0 ]; then
    echo ""
    echo "Argument details:"
    for i in $(seq 1 $#); do
        echo "  Arg $i: \"${!i}\""
    done
else
    echo ""
    echo "No arguments provided."
fi

echo ""
echo "Done!" 