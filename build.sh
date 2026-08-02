#!/bin/bash
set -e

echo "=== DawoLife Build Pipeline ==="
echo ""

# Step 1: Build the server
echo "Step 1: Building server..."
(cd server && pnpm build)

# Step 2: Build the web app
echo "Step 2: Building web app..."
(cd web && pnpm build)

echo ""
echo "=== Build Complete ==="
echo "Web: web/out/"
