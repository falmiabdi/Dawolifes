#!/usr/bin/env node
/*
 * Builds the Next.js static export for a Capacitor app.
 *
 * The critical fix: a real Android phone cannot reach the API via
 * "localhost" or "10.0.2.2". "localhost" is the phone itself and
 * "10.0.2.2" only exists inside the Android emulator.
 *
 * This script auto-detects the developer PC's LAN IP and inlines it
 * as NEXT_PUBLIC_API_URL into the bundle, so the app talks to the
 * API server over your Wi-Fi network.
 *
 * Usage:
 *   node scripts/build-app.mjs           # client build only
 *   node scripts/build-app.mjs android   # client build + cap sync android
 *   node scripts/build-app.mjs ios       # client build + cap sync ios
 *   node scripts/build-app.mjs all       # client build + cap sync
 *
 * Overrides:
 *   LAN_IP=192.168.1.10   pin the LAN IP used for the API URL
 *   API_URL=http://...:4000   use a full API URL instead of LAN_IP:4000
 */
import { spawnSync } from 'node:child_process'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const clientDir = path.join(rootDir, 'client')

const PORT = process.env.PORT || 4000

function isPrivateIp(ip) {
  const parts = ip.split('.').map(Number)
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  )
}

function detectLanIp() {
  const ifaces = networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal && isPrivateIp(net.address)) {
        return net.address
      }
    }
  }
  return null
}

function bin(name) {
  const ext = process.platform === 'win32' ? '.cmd' : ''
  return path.join(rootDir, 'node_modules', '.bin', name + ext)
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: 'inherit',
    env: { ...process.env },
  })
  return result.status === 0
}

function main() {
  const target = process.argv[2] || 'none'

  const lanIp = process.env.LAN_IP || detectLanIp()
  const apiUrl =
    process.env.API_URL ||
    (lanIp ? `http://${lanIp}:${PORT}` : `http://localhost:${PORT}`)

  const httpScheme = apiUrl.startsWith('https')
  const wsUrl = apiUrl.replace(/^https?/, httpScheme ? 'wss' : 'ws')

  console.log('\n============================================')
  console.log('  DawoLife - Capacitor app build')
  console.log('============================================')
  if (process.env.LAN_IP || process.env.API_URL) {
    console.log(`  API URL override : ${apiUrl}`)
  } else if (lanIp) {
    console.log(`  Detected LAN IP  : ${lanIp}`)
    console.log(`  API URL          : ${apiUrl}`)
    console.log('  Make sure the phone is on the same Wi-Fi network.')
    console.log('  Windows Firewall must allow inbound port ' + PORT + '.')
  } else {
    console.warn('  WARNING: no private LAN IP detected.')
    console.warn(`  Falling back to ${apiUrl} - a real phone cannot reach this.`)
    console.warn('  Pass LAN_IP=192.168.x.x or API_URL=http://... to fix.')
  }
  console.log('--------------------------------------------')

  process.env.NEXT_PUBLIC_API_URL = apiUrl
  process.env.NEXT_PUBLIC_WS_URL = wsUrl

  const okBuild = run(bin('next'), ['build'], clientDir)
  if (!okBuild) {
    console.error('❌ Next.js build failed.')
    process.exit(1)
  }
  console.log('✅ Next.js static export built.')

  if (target === 'android' || target === 'all') {
    console.log('\n⏳ Syncing to Android...')
    if (!run(bin('cap'), ['sync', 'android'], rootDir)) {
      console.error('❌ cap sync android failed.')
      process.exit(1)
    }
    console.log('✅ Android project synced.')
  }

  if (target === 'ios' || target === 'all') {
    console.log('\n⏳ Syncing to iOS...')
    if (!run(bin('cap'), ['sync', 'ios'], rootDir)) {
      console.error('❌ cap sync ios failed.')
      process.exit(1)
    }
    console.log('✅ iOS project synced.')
  }

  if (lanIp) {
    console.log('\nNext steps:')
    console.log(` 1. Start the API server (pnpm server:dev).`)
    console.log(` 2. Verify on the phone browser: ${apiUrl}/api/health`)
    console.log(` 3. Run the app: pnpm capacitor:run:android`)
  }
}

main()
