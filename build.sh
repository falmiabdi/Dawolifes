#!/bin/bash
set -e

echo "=== DawoLife Build Pipeline ==="
echo ""

# Step 1: Build the Next.js web app
echo "Step 1: Building Next.js web app..."
pnpm build

# Step 2: Sync with Capacitor Android
echo "Step 2: Syncing with Capacitor Android..."
npx cap sync android

# Step 3: Sync with Capacitor iOS
echo "Step 3: Syncing with Capacitor iOS..."
npx cap sync ios

echo ""
echo "=== Build Complete ==="
echo "Android APK: android/app/build/outputs/apk/debug/"
echo "iOS Xcode project: ios/"
