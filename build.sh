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

# Step 3: Build the mobile app (Android)
echo "Step 3: Building mobile app (Android)..."
(cd mobile && pnpm build:android)

echo ""
echo "=== Build Complete ==="
echo "Web: web/out/"
echo "Mobile Android APK: mobile/android/app/build/outputs/apk/debug/"
echo "Mobile iOS Xcode project: mobile/ios/"
