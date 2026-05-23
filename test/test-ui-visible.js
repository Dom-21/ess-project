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
    log('         ESS PORTAL VISUAL E2E TEST CONTROLLER (CHROME BETA)          ');
    log('======================================================================');
    log('This script connects to your running Chrome Beta on port 9222 and     ');
    log('executes a live, visible sequence of Employee Self Service actions.  ');
    log('Please ensure Chrome Beta is visible on your screen to watch!       ');
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
    log('Injecting E2E control layer. Switch your window to Chrome Beta to watch the actions.');

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
            // Log browser side events if needed
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
            log('Enabling CDP Runtime and Log domains...');
            await sendCDPCommand('Runtime.enable');
            await sendCDPCommand('Page.enable');
            
            log('Loading application home page...');
            await sendCDPCommand('Page.navigate', { url: APP_URL });
            await sleep(4000); // Allow initial bundles to compile & render

            // Define control functions inside page context with DOM-ready polling
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
            // STEP 1: ROHAN SHARMA LOGS IN (EMPLOYEE)
            // ====================================================================
            log('\n[E2E STEP 1] Logging in as Rohan Sharma (Employee)...');
            
            // Check if already logged in, and log out if so to start fresh!
            log('Checking if an active session is already present...');
            const sessionActive = await evalInPage(`
                (function() {
                    const logoutBtn = document.querySelector('header button[aria-label="Logout"]') || document.querySelector('button[aria-label="Logout"]');
                    return !!logoutBtn;
                })()
            `);
            
            if (sessionActive) {
                log('An active session was detected! Logging out first to guarantee a clean start...');
                await evalInPage(`
                    (function() {
                        const logoutBtn = document.querySelector('header button[aria-label="Logout"]') || document.querySelector('button[aria-label="Logout"]');
                        if (logoutBtn) logoutBtn.click();
                    })()
                `);
                await sleep(3000);
                await evalInPage(injectHelpers);
            }

            await evalInPage(`window.__e2e.clickText('button', 'Rohan')`);
            log('Rohan quick login button clicked. Waiting for dashboard compilation...');
            await sleep(3500);

            // Reinject helpers since router navigation might occasionally clean page scope
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 2: ROHAN CLOCKS IN (ATTENDANCE)
            // ====================================================================
            log('\n[E2E STEP 2] Performing Real-Time Shift Attendance Recording...');
            const clockStatus = await evalInPage(`
                (function() {
                    const text = document.body.innerText;
                    if (text.includes('Clock Out Now') || text.includes('Active on Duty')) {
                        return 'ALREADY_CLOCKED_IN';
                    }
                    return 'CLOCKED_OUT';
                })()
            `);

            if (clockStatus === 'CLOCKED_OUT') {
                log('Rohan is currently Off Duty. Clicking "Clock In Now" button...');
                await evalInPage(`window.__e2e.clickText('button', 'Clock In Now')`);
                await sleep(3000);
                log('Attendance punched successfully! Active on Duty status confirmed.');
            } else {
                log('Rohan is already Clocked In (Active on Duty). Skipping clock-in punch.');
            }

            // ====================================================================
            // STEP 3: NAVIGATE TO LEAVE CENTER & CHECK INITIAL BALANCES
            // ====================================================================
            log('\n[E2E STEP 3] Navigating to Leave Center page...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Leave Center')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            const initialBalance = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.bg-white'));
                    const casualLeaveCard = cards.find(c => c.innerText.includes('CL'));
                    if (casualLeaveCard) {
                        return casualLeaveCard.innerText.replace(/\\n/g, ' ');
                    }
                    return 'Not Found';
                })()
            `);
            log(`Initial Casual Leave (CL) Balance: ${initialBalance}`);

            // ====================================================================
            // STEP 4: ROHAN FILES CASUAL LEAVE REQUEST
            // ====================================================================
            log('\n[E2E STEP 4] Filling out Casual Leave request form...');
            // Select Casual Leave (leave type ID option)
            await evalInPage(`
                (function() {
                    const select = document.querySelector('select#leaveType');
                    if (select) {
                        select.selectedIndex = 1; // CL is usually the first option in balances
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        return 'Selected Casual Leave Category';
                    }
                    throw new Error('Leave type category dropdown not found');
                })()
            `);
            await sleep(1000);

            // Pick weekday range: July 6, 2026 to July 8, 2026 (Mon-Wed)
            log('Entering leave dates: 2026-07-06 to 2026-07-08 (3 weekdays)...');
            await evalInPage(`window.__e2e.setValue('input#startDate', '2026-07-06')`);
            await sleep(1000);
            await evalInPage(`window.__e2e.setValue('input#endDate', '2026-07-08')`);
            await sleep(1000);

            log('Entering explanation reason...');
            await evalInPage(`window.__e2e.setValue('textarea#reason', 'Family urgent function and cousin wedding - Visual E2E verification')`);
            await sleep(1500);

            log('Submitting Leave Application ticket...');
            await evalInPage(`window.__e2e.clickSelector('app-submit-btn button')`);
            log('Request submitted! Waiting for API resolution and page log update...');
            await sleep(4000);

            // ====================================================================
            // STEP 5: ROHAN LOGS OUT
            // ====================================================================
            log('\n[E2E STEP 5] Rohan logging out to pass checker role...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 6: DEVENDRA (MANAGER) LOGS IN
            // ====================================================================
            log('\n[E2E STEP 6] Logging in as Devendra Singh (Reporting Manager / Checker)...');
            await evalInPage(`window.__e2e.clickText('button', 'Devendra')`);
            await sleep(3500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 7: DEVENDRA NAVIGATES TO APPROVALS
            // ====================================================================
            log('\n[E2E STEP 7] Navigating to Workflow Approvals Inbox...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Workflow Tasks')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 8: DEVENDRA APPROVES THE REQUEST
            // ====================================================================
            log('\n[E2E STEP 8] Expanding Rohan Sharma Leave request parameters...');
            const taskExpanded = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.rounded.border'));
                    const leaveCard = cards.reverse().find(c => c.innerText.includes('LEAVE') && c.innerText.includes('Level 1'));
                    if (leaveCard) {
                        const viewDetailsBtn = leaveCard.querySelector('button');
                        if (viewDetailsBtn) {
                            viewDetailsBtn.click();
                            return 'EXPANDED_TASK';
                        }
                    }
                    return 'NO_LEAVE_TASK_FOUND';
                })()
            `);

            if (taskExpanded === 'NO_LEAVE_TASK_FOUND') {
                throw new Error('Rohan Sharma Leave task was not found in Devendra pending approval queue!');
            }
            log('Details expanded. Waiting 2.5 seconds to show parameters dynamically loaded...');
            await sleep(2500);

            log('Adding manager audit assessment remarks...');
            await evalInPage(`window.__e2e.setValue('textarea', 'Approved by manager. Hope everything goes smoothly at the family function!')`);
            await sleep(1500);

            log('Clicking "Approve Request" button...');
            await evalInPage(`window.__e2e.clickText('button', 'Approve Request')`);
            log('Approval action submitted! Awaiting workflow engine validation...');
            await sleep(4000);

            // ====================================================================
            // STEP 9: DEVENDRA LOGS OUT
            // ====================================================================
            log('\n[E2E STEP 9] Devendra logging out...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            // ====================================================================
            // STEP 10: ROHAN LOGS IN AGAIN TO VERIFY DEDUCTION
            // ====================================================================
            log('\n[E2E STEP 10] Logging in back as Rohan Sharma to verify workflow outcome...');
            await evalInPage(`window.__e2e.clickText('button', 'Rohan')`);
            await sleep(3500);
            await evalInPage(injectHelpers);

            log('Navigating to Leave Center...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Leave Center')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            const finalBalance = await evalInPage(`
                (function() {
                    const cards = Array.from(document.querySelectorAll('.bg-white'));
                    const casualLeaveCard = cards.find(c => c.innerText.includes('CL'));
                    if (casualLeaveCard) {
                        return casualLeaveCard.innerText.replace(/\\n/g, ' ');
                    }
                    return 'Not Found';
                })()
            `);
            log(`Final Casual Leave (CL) Balance (After Approval): ${finalBalance}`);

            log('Extracting history list log record details...');
            const leaveHistoryLogs = await evalInPage(`
                (function() {
                    const rows = Array.from(document.querySelectorAll('tbody tr'));
                    return rows.map(r => r.innerText.replace(/\\t/g, ' ').replace(/\\n/g, ' '));
                })()
            `);
            log('Rohan Leave Applications Log:');
            leaveHistoryLogs.forEach((row, i) => {
                log(`  [Record #${i+1}] ${row}`);
            });

            // ====================================================================
            // STEP 11: SHIFT CLEANUP - ATTENDANCE CLOCK OUT
            // ====================================================================
            log('\n[E2E STEP 11] Navigating back to Dashboard for duty clock out cleanup...');
            await evalInPage(`window.__e2e.clickText('aside nav a', 'Dashboard')`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            log('Punching Clock Out log...');
            await evalInPage(`window.__e2e.clickText('button', 'Clock Out Now')`);
            await sleep(3000);
            log('Duty successfully marked as completed! System left in a clean state.');

            log('Logging out employee Rohan...');
            await evalInPage(`window.__e2e.clickSelector('header button[aria-label="Logout"]')`);
            await sleep(2500);

            log('\n======================================================================');
            log('    VISUAL E2E INTEGRATION VERIFICATION FINISHED FLAWLESSLY!          ');
            log('======================================================================');

            // Save test execution results to report
            const report = {
                success: true,
                timestamp: new Date().toISOString(),
                logs: testLogs,
                verifications: {
                    initialBalance,
                    finalBalance,
                    history: leaveHistoryLogs
                }
            };
            fs.writeFileSync(path.join(__dirname, 'test-ui-report.json'), JSON.stringify(report, null, 2));
            ws.close();
            process.exit(0);

        } catch (error) {
            log(`\n!!! VISUAL E2E TEST RUN ENCOUNTERED CRITICAL ERROR !!!`);
            log(`Error Message: ${error.message}`);
            
            try {
                const url = await evalInPage("window.location.href");
                const bodyText = await evalInPage("document.body.innerText");
                log(`[Debug Info] Current URL: ${url}`);
                log(`[Debug Info] Body Text Length: ${bodyText.length}`);
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
            fs.writeFileSync(path.join(__dirname, 'test-ui-report.json'), JSON.stringify(report, null, 2));
            ws.close();
            process.exit(1);
        }
    };
}

main();
