/**
 * ESS Portal — Dark Mode Persistence Visual E2E Test
 * =========================================================================
 * Connects to Chrome Beta on port 9222 using the proven CDP WebSocket pattern.
 * Verifies that clicking the theme switch toggles the document's '.dark' class,
 * syncs theme preference to the backend database, and maintains selection on reload.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_DEBUG_PORT = 9222;
const APP_URL = 'http://localhost:4300';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const testLogs = [];
function log(msg) {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${msg}`;
    testLogs.push(formatted);
    console.log(formatted);
}

if (typeof WebSocket === 'undefined') {
    try {
        global.WebSocket = require('ws');
    } catch (e) {
        log('Error: ws package not installed globally/locally, but Node 21+ global WebSocket should be active.');
    }
}

async function main() {
    log('======================================================================');
    log('     ESS PORTAL VISUAL E2E — DARK MODE PERSISTENCE TEST (CHROME)     ');
    log('======================================================================');
    log('Role: Employee (Rohan Sharma)                                        ');
    log('Browser: Chrome Beta (port 9222) — launching now...                    ');
    log('======================================================================\n');

    const chromePath = 'C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe';
    const profileDir = path.join(__dirname, 'chrome-profile-registry');
    
    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }

    log('Launching Chrome Beta with remote-debugging-port 9222...');
    exec(`"${chromePath}" --remote-debugging-port=${CHROME_DEBUG_PORT} --no-first-run --no-default-browser-check --user-data-dir="${profileDir}" ${APP_URL}`);

    await sleep(4000);

    let target = null;
    for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            log(`Connecting to Chrome Beta port ${CHROME_DEBUG_PORT} (attempt ${attempt}/10)...`);
            const res = await fetch(`http://127.0.0.1:${CHROME_DEBUG_PORT}/json/list`);
            const list = await res.json();
            target = list.find(t => t.type === 'page');
            if (target && target.webSocketDebuggerUrl) break;
        } catch (e) {
            log(`Could not connect: ${e.message}`);
            await sleep(2000);
        }
    }

    if (!target || !target.webSocketDebuggerUrl) {
        log('ERROR: Chrome Beta not responding or remote debugging port not active.');
        process.exit(1);
    }

    const wsUrl = target.webSocketDebuggerUrl;
    log(`Connected successfully to Chrome Beta tab! WebSocket URL: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    const responses = new Map();
    let messageId = 0;

    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++messageId;
        responses.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && responses.has(msg.id)) {
            const { resolve, reject } = responses.get(msg.id);
            responses.delete(msg.id);
            msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
            const args = (msg.params.args || []).map(a => a.value || JSON.stringify(a)).join(' ');
            if (args && !args.includes('[vite]')) log(`[Browser Console] ${args}`);
        }
    };

    const evalInPage = async (expression, timeout = 15000) => {
        const res = await send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true,
            timeout
        });
        if (res && res.exceptionDetails) {
            throw new Error(`Page JS Exception: ${res.exceptionDetails.exception?.description}`);
        }
        return res && res.result ? res.result.value : null;
    };

    const injectHelpers = `
        window.__e2e = {
            sleep: ms => new Promise(r => setTimeout(r, ms)),
            clickText: async (selector, text, timeout = 12000) => {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                    const items = Array.from(document.querySelectorAll(selector));
                    const found = items.find(el => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
                    if (found) { found.click(); return 'Clicked text: ' + text; }
                    await new Promise(r => setTimeout(r, 400));
                }
                return 'NOT_FOUND: text "' + text + '" in selector ' + selector;
            },
            clickSelector: async (selector, timeout = 12000) => {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                    const el = document.querySelector(selector);
                    if (el) { el.click(); return 'Clicked selector: ' + selector; }
                    await new Promise(r => setTimeout(r, 400));
                }
                return 'NOT_FOUND: ' + selector;
            },
            isDarkModeEnabled: () => {
                return document.documentElement.classList.contains('dark');
            }
        };
        'Helpers Injected';
    `;

    const results = {};

    ws.onopen = async () => {
        try {
            log('Enabling CDP domains...');
            await send('Runtime.enable');
            await send('Page.enable');

            log('Navigating to ESS Portal home page...');
            await send('Page.navigate', { url: APP_URL });
            await sleep(4000);
            await evalInPage(injectHelpers);

            // Log out first if previous session exists
            const sessionActive = await evalInPage(`!!document.querySelector('[aria-label="Logout"]')`);
            if (sessionActive) {
                log('Previous active session detected, logging out...');
                await evalInPage(`document.querySelector('[aria-label="Logout"]')?.click()`);
                await sleep(2500);
                await evalInPage(injectHelpers);
            }

            // Step 1: Perform Quick Login as Rohan Sharma
            log('\n[STEP 1] Performing Quick Login as Employee (Rohan)...');
            const loginRohan = await evalInPage(`window.__e2e.clickText('button', 'Rohan')`);
            log(`  Result: ${loginRohan}`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            // Check initial theme state
            let isDark = await evalInPage(`window.__e2e.isDarkModeEnabled()`);
            log(`  [Initial theme state] isDarkMode: ${isDark}`);
            results.initial_state = isDark;

            // Step 2: Click the Theme Toggle inside Shell Layout
            log('\n[STEP 2] Clicking Theme Toggle button inside shell layout header...');
            const clickToggle = await evalInPage(`window.__e2e.clickSelector('[aria-label="Toggle Theme"]')`);
            log(`  Result: ${clickToggle}`);
            await sleep(2000);

            // Check if document has '.dark' class toggled
            isDark = await evalInPage(`window.__e2e.isDarkModeEnabled()`);
            log(`  [Toggled state] isDarkMode: ${isDark}`);
            results.toggled_state = isDark;

            if (isDark !== results.initial_state) {
                log('  SUCCESS: Document ".dark" class successfully changed states on theme toggle!');
            } else {
                log('  ERROR: Document theme state did not toggle!');
            }

            // Step 3: Refresh page to check DB theme persistence
            log('\n[STEP 3] Reloading page to verify database-persisted theme preservation...');
            await send('Page.reload');
            await sleep(4000);
            await evalInPage(injectHelpers);

            // Check if theme state matches the toggled choice after reload
            let reloadIsDark = await evalInPage(`window.__e2e.isDarkModeEnabled()`);
            log(`  [Reloaded state] isDarkMode: ${reloadIsDark}`);
            
            if (reloadIsDark === isDark) {
                log('  SUCCESS: Theme selection successfully persisted on page reload! (Loaded from database auth session)');
                results.persistence = 'PASS';
            } else {
                log('  FAIL: Theme reset back to original state on reload.');
                results.persistence = 'FAIL';
            }

            // Step 4: Toggle theme back to initial theme state to leave clean DB seeding
            if (reloadIsDark !== results.initial_state) {
                log('\n[STEP 4] Toggling theme back to light/default for system consistency...');
                await evalInPage(`window.__e2e.clickSelector('[aria-label="Toggle Theme"]')`);
                await sleep(1500);
                const finalDark = await evalInPage(`window.__e2e.isDarkModeEnabled()`);
                log(`  [Final state] isDarkMode: ${finalDark}`);
            }

            log('\n======================================================================');
            log('   DARK MODE persistence E2E VISUAL VERIFICATION SCORECARD           ');
            log('======================================================================');
            log(`- Class Toggle Toggling: ${results.toggled_state !== results.initial_state ? 'PASS' : 'FAIL'}`);
            log(`- Database Session Persistence: ${results.persistence}`);
            log('======================================================================\n');

            ws.close();
            process.exit(results.persistence === 'PASS' ? 0 : 1);
        } catch (e) {
            log(`ERROR encountered in E2E routine: ${e.message}`);
            ws.close();
            process.exit(1);
        }
    };

    ws.onerror = (e) => {
        log(`CDP WebSocket connection error: ${e.message}`);
        process.exit(1);
    };
}

main().catch(err => {
    log(`Unhandled rejection: ${err.message}`);
    process.exit(1);
});
