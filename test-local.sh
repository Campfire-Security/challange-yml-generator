#!/bin/bash

# Quick local test script for Challenge YAML Generator
# This script starts a simple HTTP server to test the static site locally

echo "Starting local test server..."
echo ""
echo "The site will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2, then suggest alternatives
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "Python not found. Please use one of these alternatives:"
    echo "  - Install Python: https://www.python.org/downloads/"
    echo "  - Use Node.js: npx serve ."
    echo "  - Use VS Code Live Server extension"
    echo "  - Or simply open index.html directly in your browser"
    exit 1
fi

