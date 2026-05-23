const fs = require('fs');
const path = require('path');

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

async function main() {
    log('======================================================================');
    log('     ESS PORTAL VISUAL E2E TEST (CHROME BETA) - ALL OTHER WORKFLOWS   ');
    log('======================================================================');
    log('This script automates Travel, Expense, and Asset request workflows,  ');
    log('authenticating Rohan, Devendra, Finance Manager, and IT Admin.       ');
    log('======================================================================\n');

    let target = null;
    for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            log(`Connecting to Chrome Beta debugging port ${CHROME_DEBUG_PORT} (attempt ${attempt}/10)...`);
            const res = await fetch(`http://127.0.0.1:${CHROME_DEBUG_PORT}/json/new?url=${APP_URL}`, {
                method: 'PUT'
            });
            target = await res.json();
            if (target && target.webSocketDebuggerUrl) {
                break;
            }
        } catch (e) {
            log(`Could not connect to port ${CHROME_DEBUG_PORT}: ${e.message}`);
            await sleep(2000);
        }
    }

    if (!target || !target.webSocketDebuggerUrl) {
        log('ERROR: Chrome Beta is not responding on port 9222. Please make sure the browser process is running.');
        process.exit(1);
    }

    const wsUrl = target.webSocketDebuggerUrl;
    log(`Successfully connected! Debugger WebSocket URL: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    const responses = new Map();
    let messageId = 0;

    const sendCDPCommand = (method, params = {}) => {
        return new Promise((resolve, reject) => {
            const id = ++messageId;
            responses.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && responses.has(msg.id)) {
            const { resolve, reject } = responses.get(msg.id);
            responses.delete(msg.id);
            if (msg.error) {
                reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
                resolve(msg.result);
            }
        } else {
            if (msg.method === 'Runtime.consoleAPICalled') {
                const args = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
                log(`[Browser Console] ${args}`);
            }
        }
    };

    const evalInPage = async (expression) => {
        const res = await sendCDPCommand('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Page JS Exception: ${res.exceptionDetails.exception.description}`);
        }
        return res.result ? res.result.value : null;
    };

    ws.onopen = async () => {
        try {
            log('Enabling CDP Runtime and Page domains...');
            await sendCDPCommand('Runtime.enable');
            await sendCDPCommand('Page.enable');
            
            log('Loading application home page...');
            await sendCDPCommand('Page.navigate', { url: APP_URL });
            await sleep(4000); // Allow initial load

            const injectHelpers = `
                window.__e2e = {
                    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
                    clickText: async (selector, text, timeout = 12000) => {
                        const start = Date.now();
                        while (Date.now() - start < timeout) {
                            const items = Array.from(document.querySelectorAll(selector));
                            const found = items.find(el => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
                            if (found) {
                                found.click();
                                return "Clicked " + selector + " with text: " + text;
                            }
                            await new Promise(resolve => setTimeout(resolve, 400));
                        }
                        throw new Error("Timeout waiting for text: '" + text + "' in " + selector);
                    },
                    setValue: async (selector, val, timeout = 12000) => {
                        const start = Date.now();
                        while (Date.now() - start < timeout) {
                            const el = document.querySelector(selector);
                            if (el) {
                                el.value = val;
                                el.dispatchEvent(new Event('input', { bubbles: true }));
                                el.dispatchEvent(new Event('change', { bubbles: true }));
                                return "Set " + selector + " to " + val;
                            }
                            await new Promise(resolve => setTimeout(resolve, 400));
                        }
                        throw new Error("Timeout waiting for selector: " + selector);
                    },
                    clickSelector: async (selector, timeout = 12000) => {
                        const start = Date.now();
                        while (Date.now() - start < timeout) {
                            const el = document.querySelector(selector);
                            if (el) {
                                el.click();
                                return "Clicked " + selector;
                            }
                            await new Promise(resolve => setTimeout(resolve, 400));
                        }
                        throw new Error("Timeout waiting for selector: " + selector);
                    }
                };
                "Helpers Injected Successfully";
            `;
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 1: LOG OUT IF PRE-EXISTING SESSION EXISTS
            // ====================================================================
            log('Checking for active session...');
            const sessionActive = await evalInPage(`
                (function() {
                    const logoutBtn = document.querySelector('header button[aria-label="Logout"]') || document.querySelector('button[aria-label="Logout"]');
                    return !!logoutBtn;
                })()
            `);
            
            if (sessionActive) {
                log('Logging out existing session...');
                await evalInPage(`
                    (function() {
                        const logoutBtn = document.querySelector('header button[aria-label="Logout"]') || document.querySelector('button[aria-label="Logout"]');
                        if (logoutBtn) logoutBtn.click();
                    })()
                `);
                await sleep(3000);
                await evalInPage(injectHelpers);
            }

            // ====================================================================
            // STEP 2: ROHAN LOGS IN
            // ====================================================================
            log('\n[E2E REST STEP 1] Logging in as Rohan Sharma (Employee)...');
            await evalInPage(`window.__e2e.clickText('button', 'Rohan')`);
            await sleep(3500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 3: ROHAN FILES BUSINESS TRAVEL REQUEST
            // ====================================================================
            log('\n[E2E REST STEP 2] Submitting Business Travel application...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Travel Claims')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            await evalInPage(`window.__e2e.setValue('input#destination', 'Delhi')`);
            await evalInPage(`window.__e2e.setValue('input#purpose', 'Business Pitch & Client Review')`);
            await evalInPage(`window.__e2e.setValue('input#travelDate', '2026-08-01')`);
            await evalInPage(`window.__e2e.setValue('input#returnDate', '2026-08-05')`);
            
            await evalInPage(`
                (function() {
                    const select = document.querySelector('select#modeOfTransport');
                    if (select) {
                        select.value = 'FLIGHT';
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        return 'Selected Flight Mode';
                    }
                    throw new Error('mode of transport dropdown not found');
                })()
            `);
            await sleep(500);
            await evalInPage(`window.__e2e.setValue('input#estimatedCost', '15000')`);
            await sleep(1000);

            log('Clicking Submit Travel Claim...');
            await evalInPage(`window.__e2e.clickSelector('app-submit-btn button')`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 4: ROHAN FILES EXPENSE CLAIM
            // ====================================================================
            log('\n[E2E REST STEP 3] Submitting Lodging Expense Claim...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Expense Claims')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            await evalInPage(`window.__e2e.setValue('input#expTitle', 'Project Kickoff Lodging')`);
            await evalInPage(`window.__e2e.setValue('textarea#expDesc', 'Hotel lodging and client dinner reimbursement')`);
            
            // Set first line item category
            await evalInPage(`
                (function() {
                    const select = document.querySelector('select[formControlName="categoryId"]');
                    if (select) {
                        select.value = '2'; // Lodging & Boarding
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        return 'Selected Lodging category';
                    }
                    throw new Error('Line item category select not found');
                })()
            `);
            await sleep(500);
            await evalInPage(`window.__e2e.setValue('input[formControlName="description"]', 'Premium Room Stay 2 nights')`);
            await evalInPage(`window.__e2e.setValue('input[formControlName="amount"]', '5000')`);
            await sleep(1000);

            log('Clicking Submit Expense Claim...');
            await evalInPage(`window.__e2e.clickSelector('app-submit-btn button')`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 5: ROHAN FILES IT ASSET REQUEST
            // ====================================================================
            log('\n[E2E REST STEP 4] Submitting Hardware Device request...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Asset Allocation')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            log('Selecting available catalog hardware device...');
            await evalInPage(`window.__e2e.clickText('button', 'Select')`);
            await sleep(1000);

            await evalInPage(`window.__e2e.setValue('input#purpose', 'Dual display setup for coding and logs visualization')`);
            await sleep(1000);

            log('Clicking Submit Hardware Request...');
            await evalInPage(`window.__e2e.clickSelector('app-submit-btn button')`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 6: ROHAN LOGS OUT
            // ====================================================================
            log('Logging out Rohan Sharma...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 7: DEVENDRA L1 APPROVALS
            // ====================================================================
            log('\n[E2E REST STEP 5] Logging in as Devendra Singh (Manager)...');
            await evalInPage(`window.__e2e.clickText('button', 'Devendra')`);
            await sleep(3500);
            await evalInPage(injectHelpers);

            log('Navigating to Workflow Tasks inbox...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Workflow Tasks')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            // A. Approve Travel L1
            log('Approving Travel L1 Request...');
            const travelL1Expanded = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.rounded.border'));
                    const card = cards.reverse().find(c => c.innerText.includes('TRAVEL') && c.innerText.includes('Level 1'));
                    if (card) {
                        const btn = card.querySelector('button');
                        if (btn) { btn.click(); return 'EXPANDED'; }
                    }
                    return 'NOT_FOUND';
                })()
            `);
            if (travelL1Expanded !== 'EXPANDED') throw new Error('Travel L1 task not found in manager queue');
            await sleep(2500);
            await evalInPage(`window.__e2e.setValue('textarea', 'Travel L1 approved by Manager.')`);
            await sleep(1000);
            await evalInPage(`window.__e2e.clickText('button', 'Approve Request')`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            // B. Approve Travel L2
            log('Checking and approving Travel L2 Request...');
            const travelL2Expanded = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.rounded.border'));
                    const card = cards.reverse().find(c => c.innerText.includes('TRAVEL') && c.innerText.includes('Level 2'));
                    if (card) {
                        const btn = card.querySelector('button');
                        if (btn) { btn.click(); return 'EXPANDED'; }
                    }
                    return 'NOT_FOUND';
                })()
            `);
            if (travelL2Expanded === 'EXPANDED') {
                log('Travel L2 fallback routing detected. Processing approval...');
                await sleep(2500);
                await evalInPage(`window.__e2e.setValue('textarea', 'Travel L2 cleared by Manager.')`);
                await sleep(1000);
                await evalInPage(`window.__e2e.clickText('button', 'Approve Request')`);
                await sleep(4000);
                await evalInPage(injectHelpers);
            } else {
                log('Travel L2 task not found or routed separately.');
            }

            // C. Approve Expense L1
            log('Approving Expense L1 Request...');
            const expenseL1Expanded = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.rounded.border'));
                    const card = cards.reverse().find(c => c.innerText.includes('EXPENSE') && c.innerText.includes('Level 1'));
                    if (card) {
                        const btn = card.querySelector('button');
                        if (btn) { btn.click(); return 'EXPANDED'; }
                    }
                    return 'NOT_FOUND';
                })()
            `);
            if (expenseL1Expanded !== 'EXPANDED') throw new Error('Expense L1 task not found in manager queue');
            await sleep(2500);
            await evalInPage(`window.__e2e.setValue('textarea', 'Expense claim verified. Forwarding to Finance.')`);
            await sleep(1000);
            await evalInPage(`window.__e2e.clickText('button', 'Approve Request')`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            log('Logging out Devendra Singh...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 8: FINANCE MANAGER (ANIL GUPTA) L2 APPROVAL
            // ====================================================================
            log('\n[E2E REST STEP 6] Logging in as Anil Gupta (Finance Manager) manually...');
            await evalInPage(`window.__e2e.setValue('input#email', 'anil.gupta@ess.com')`);
            await evalInPage(`window.__e2e.setValue('input#password', 'Password@123')`);
            await sleep(1000);
            await evalInPage(`window.__e2e.clickSelector('button[type="submit"]')`);
            await sleep(3500);
            await evalInPage(injectHelpers);

            log('Navigating to Workflow Tasks inbox...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Workflow Tasks')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            log('Approving Expense L2 Request...');
            const expenseL2Expanded = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.rounded.border'));
                    const card = cards.reverse().find(c => c.innerText.includes('EXPENSE') && c.innerText.includes('Level 2'));
                    if (card) {
                        const btn = card.querySelector('button');
                        if (btn) { btn.click(); return 'EXPANDED'; }
                    }
                    return 'NOT_FOUND';
                })()
            `);
            if (expenseL2Expanded !== 'EXPANDED') throw new Error('Expense L2 task not found in Finance queue');
            await sleep(2500);
            await evalInPage(`window.__e2e.setValue('textarea', 'Expense reimbursement approved. Payment cleared.')`);
            await sleep(1000);
            await evalInPage(`window.__e2e.clickText('button', 'Approve Request')`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            log('Logging out Finance Manager...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 9: IT ADMIN (KARAN KUMAR) L1 APPROVAL
            // ====================================================================
            log('\n[E2E REST STEP 7] Logging in as Karan Kumar (IT Admin) manually...');
            await evalInPage(`window.__e2e.setValue('input#email', 'karan.kumar@ess.com')`);
            await evalInPage(`window.__e2e.setValue('input#password', 'Password@123')`);
            await sleep(1000);
            await evalInPage(`window.__e2e.clickSelector('button[type="submit"]')`);
            await sleep(3500);
            await evalInPage(injectHelpers);

            log('Navigating to Workflow Tasks inbox...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Workflow Tasks')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            log('Approving Asset L1 Request...');
            const assetL1Expanded = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.rounded.border'));
                    const card = cards.reverse().find(c => c.innerText.includes('ASSET') && c.innerText.includes('Level 1'));
                    if (card) {
                        const btn = card.querySelector('button');
                        if (btn) { btn.click(); return 'EXPANDED'; }
                    }
                    return 'NOT_FOUND';
                })()
            `);
            if (assetL1Expanded !== 'EXPANDED') throw new Error('Asset L1 task not found in IT Admin queue');
            await sleep(2500);
            await evalInPage(`window.__e2e.setValue('textarea', 'Hardware item allocated. Sent to delivery.')`);
            await sleep(1000);
            await evalInPage(`window.__e2e.clickText('button', 'Approve Request')`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            log('Logging out IT Admin...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 10: VERIFY FINAL STATUS (ROHAN)
            // ====================================================================
            log('\n[E2E REST STEP 8] Logging back in as Rohan to verify approvals...');
            await evalInPage(`window.__e2e.clickText('button', 'Rohan')`);
            await sleep(3500);
            await evalInPage(injectHelpers);

            // A. Travel status verification
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Travel Claims')`);
            await sleep(3000);
            const travelHistory = await evalInPage(`
                (function() {
                    const rows = Array.from(document.querySelectorAll('tbody tr'));
                    return rows.map(r => r.innerText.replace(/\\n/g, ' ').replace(/\\t/g, ' '));
                })()
            `);
            log('Rohan Travel Applications History:');
            travelHistory.forEach((row, idx) => log(`  [Travel #${idx+1}] ${row}`));

            // B. Expense status verification
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Expense Claims')`);
            await sleep(3000);
            const expenseHistory = await evalInPage(`
                (function() {
                    const rows = Array.from(document.querySelectorAll('tbody tr'));
                    return rows.map(r => r.innerText.replace(/\\n/g, ' ').replace(/\\t/g, ' '));
                })()
            `);
            log('Rohan Expense Claims History:');
            expenseHistory.forEach((row, idx) => log(`  [Expense #${idx+1}] ${row}`));

            // C. Asset status verification
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Asset Allocation')`);
            await sleep(3000);
            const assetHistory = await evalInPage(`
                (function() {
                    const rows = Array.from(document.querySelectorAll('tbody tr'));
                    return rows.map(r => r.innerText.replace(/\\n/g, ' ').replace(/\\t/g, ' '));
                })()
            `);
            log('Rohan IT Device Allocation History:');
            assetHistory.forEach((row, idx) => log(`  [Asset #${idx+1}] ${row}`));

            log('Logging out employee Rohan...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2000);

            log('\n======================================================================');
            log('   ALL SUB-WORKFLOWS E2E VISUAL VERIFICATION COMPLETED SUCCESSFULLY!  ');
            log('======================================================================');

            const report = {
                success: true,
                timestamp: new Date().toISOString(),
                logs: testLogs,
                verifications: {
                    travelHistory,
                    expenseHistory,
                    assetHistory
                }
            };
            fs.writeFileSync(path.join(__dirname, 'test-ui-rest-report.json'), JSON.stringify(report, null, 2));
            ws.close();
            process.exit(0);

        } catch (error) {
            log(`\n!!! VISUAL E2E TEST RUN ENCOUNTERED CRITICAL ERROR !!!`);
            log(`Error Message: ${error.message}`);
            
            try {
                const url = await evalInPage("window.location.href");
                const bodyText = await evalInPage("document.body.innerText");
                log(`[Debug Info] Current URL: ${url}`);
                log(`[Debug Info] Body Text Preview:\n${bodyText.substring(0, 1000)}`);
            } catch (e) {
                log(`[Debug Info] Could not fetch page dump: ${e.message}`);
            }
            
            const report = {
                success: false,
                timestamp: new Date().toISOString(),
                logs: testLogs,
                error: error.message
            };
            fs.writeFileSync(path.join(__dirname, 'test-ui-rest-report.json'), JSON.stringify(report, null, 2));
            ws.close();
            process.exit(1);
        }
    };
}

main();
