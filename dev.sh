#!/bin/bash
set -e

echo "=== DawoLife Development Pipeline ==="
echo ""

# Step 1: Start the Express backend server
echo "Step 1: Starting Express backend server..."
cd server && pnpm dev &
BACKEND_PID=$!

# Step 2: Start Next.js dev server
echo "Step 2: Starting Next.js dev server..."
cd ..
pnpm dev &
NEXT_PID=$!

echo ""
echo "Backend PID: $BACKEND_PID"
echo "Next.js PID: $NEXT_PID"
echo ""
echo "Web app: http://localhost:3000"
echo "API server: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
wait
