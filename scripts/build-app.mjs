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
import { existsSync, readdirSync, readFileSync, statSync, rmSync } from 'node:fs'
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
  const isWindows = process.platform === 'win32'
  // On Windows the npm shims are .cmd files, which can only be launched via cmd.exe
  const result = isWindows
    ? spawnSync('cmd.exe', ['/c', command, ...args], {
        cwd,
        stdio: 'inherit',
        env: { ...process.env },
      })
    : spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env },
      })
  return result.status === 0
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else {
      yield full
    }
  }
}

// Confirms the compiled bundle actually contains the baked API URL.
// The classic failure mode is a build that baked "http://localhost:4000",
// which a real phone can never reach.
function verifyBakedApiUrl(apiUrl) {
  const outDir = path.join(clientDir, 'out')
  let found = false
  let staleDefault = false
  for (const file of walk(outDir)) {
    if (!/\.js$/.test(file)) continue
    try {
      if (statSync(file).size > 10_000_000) continue
      const content = readFileSync(file, 'utf8')
      if (content.includes(apiUrl)) {
        found = true
      }
      if (content.includes('http://localhost:4000')) {
        staleDefault = true
      }
    } catch {
      // ignore unreadable files
    }
  }
  if (!found) {
    console.error('\n❌ VERIFY FAILED: baked API URL was not found in the built bundle.')
    if (staleDefault) {
      console.error(`   The bundle still contains "http://localhost:4000" (${apiUrl}).`)
      console.error('   Next.js caches compiled output — clean the cache and rebuild:')
      console.error('     Remove client/.next and client/out, then re-run this script.')
    } else {
      console.error(`   Expected to find: ${apiUrl}`)
    }
    process.exit(1)
  }
  console.log(`✅ Verified API URL baked into bundle: ${apiUrl}`)
}

function setupAdbReverse() {
  // Lets the phone reach the API server over USB without Wi-Fi:
  // adb reverse tcp:4000 tcp:4000  ->  phone's localhost:4000 forwards to this PC.
  const candidates = []
  if (process.env.ANDROID_HOME) {
    candidates.push(path.join(process.env.ANDROID_HOME, 'platform-tools', `adb${process.platform === 'win32' ? '.exe' : ''}`))
  }
  if (process.env.ANDROID_SDK_ROOT) {
    candidates.push(path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', `adb${process.platform === 'win32' ? '.exe' : ''}`))
  }
  if (process.platform === 'win32') {
    const local = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe')
    if (!candidates.includes(local)) candidates.push(local)
  }
  candidates.push('adb')
  let adb = candidates.find((c) => {
    try {
      return spawnSync(c, ['version'], { stdio: 'pipe' }).status === 0
    } catch {
      return false
    }
  })
  if (!adb) {
    console.warn('⚠️  Could not locate adb. For USB debugging without Wi-Fi, run: adb reverse tcp:4000 tcp:4000')
    return
  }
  const res = spawnSync(adb, ['reverse', 'tcp:4000', `tcp:${PORT}`], { stdio: 'pipe', encoding: 'utf8' })
  if (res.status === 0) {
    console.log(`✅ adb reverse tcp:${PORT} -> this PC (phone's localhost:${PORT} works over USB).`)
  } else {
    console.warn(`⚠️  adb reverse failed (${(res.stderr || res.stdout || 'unknown').trim()}).`)
    console.warn('   For USB debugging without Wi-Fi, run: adb reverse tcp:4000 tcp:4000')
  }
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

  // Next.js caches compiled output keyed on env values; a previous build that
  // baked localhost:4000 can otherwise be reused. Clear it so the new API URL
  // is guaranteed to land in the bundle.
  for (const dir of [path.join(clientDir, '.next'), path.join(clientDir, 'out')]) {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  }

  const okBuild = run(bin('next'), ['build'], clientDir)
  if (!okBuild) {
    console.error('❌ Next.js build failed.')
    process.exit(1)
  }
  console.log('✅ Next.js static export built.')

  verifyBakedApiUrl(apiUrl)

  if (target === 'android' || target === 'all') {
    console.log('\n⏳ Syncing to Android...')
    if (!run(bin('cap'), ['sync', 'android'], rootDir)) {
      console.error('❌ cap sync android failed.')
      process.exit(1)
    }
    console.log('✅ Android project synced.')
    setupAdbReverse()
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
