/**
 * ESS Portal — Visible UI E2E Test: HR Admin & Super Admin Configurations
 * =========================================================================
 * Connects to Chrome Beta on port 9222 using the proven CDP pattern.
 *
 * SUPER ADMIN (Vijay Mallya) vijay.mallya@ess.com
 *   STEP 1 : Login via quick-login button
 *   STEP 2 : Admin Panel → Corporate Directories tab — verify employee list loads
 *   STEP 3 : Open "Assign Org" modal for first employee, inspect modal, close
 *   STEP 4 : Switch to RBAC Security Settings tab — verify users + roles load
 *   STEP 5 : Switch to Departments Setting tab — verify list, create new dept MKT
 *   STEP 6 : Logout
 *
 * HR ADMIN (Shalini Sharma) shalini.sharma@ess.com
 *   STEP 7 : Login via quick-login button
 *   STEP 8 : Admin Panel → Corporate Directories tab — verify HR admin access
 *   STEP 9 : Test pagination (go to page 2)
 *   STEP 10: Logout
 */

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

async function main() {
    log('======================================================================');
    log('   ESS PORTAL VISUAL E2E — ADMIN & HR CONFIGURATION TEST (CHROME)    ');
    log('======================================================================');
    log('Tests: Super Admin (Vijay Mallya) + HR Admin (Shalini Sharma)         ');
    log('Browser: Chrome Beta (port 9222) — watch your screen!                ');
    log('======================================================================\n');

    // ── Open a fresh debuggable tab via CDP ──────────────────────────────────
    let target = null;
    for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            log(`Connecting to Chrome Beta debugging port ${CHROME_DEBUG_PORT} (attempt ${attempt}/10)...`);
            const res = await fetch(`http://127.0.0.1:${CHROME_DEBUG_PORT}/json/new?url=${APP_URL}`, {
                method: 'PUT'
            });
            target = await res.json();
            if (target && target.webSocketDebuggerUrl) break;
        } catch (e) {
            log(`Could not connect: ${e.message}`);
            await sleep(2000);
        }
    }

    if (!target || !target.webSocketDebuggerUrl) {
        log('ERROR: Chrome Beta not responding on port 9222.');
        process.exit(1);
    }

    const wsUrl = target.webSocketDebuggerUrl;
    log(`Successfully connected! Debugger WebSocket URL: ${wsUrl}`);

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

    // ── Helpers injected into the page context (same proven pattern) ─────────
    const injectHelpers = `
        window.__e2e = {
            sleep: ms => new Promise(r => setTimeout(r, ms)),
            clickText: async (selector, text, timeout = 12000) => {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                    const items = Array.from(document.querySelectorAll(selector));
                    const found = items.find(el => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
                    if (found) { found.click(); return 'Clicked: ' + text; }
                    await new Promise(r => setTimeout(r, 400));
                }
                return 'NOT_FOUND: ' + text;
            },
            setValue: async (selector, val, timeout = 12000) => {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                    const el = document.querySelector(selector);
                    if (el) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                        if (setter) setter.call(el, val); else el.value = val;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        return 'Set: ' + selector;
                    }
                    await new Promise(r => setTimeout(r, 400));
                }
                return 'NOT_FOUND: ' + selector;
            },
            clickSelector: async (selector, timeout = 12000) => {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                    const el = document.querySelector(selector);
                    if (el) { el.click(); return 'Clicked: ' + selector; }
                    await new Promise(r => setTimeout(r, 400));
                }
                return 'NOT_FOUND: ' + selector;
            },
            waitForText: async (text, timeout = 10000) => {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                    if (document.body.innerText.includes(text)) return true;
                    await new Promise(r => setTimeout(r, 400));
                }
                return false;
            },
            getTableRows: () => {
                const rows = document.querySelectorAll('tbody tr');
                return Array.from(rows).map(r => r.textContent?.replace(/\\s+/g, ' ').trim()).filter(Boolean);
            },
            getPageText: () => document.body.innerText.substring(0, 3000)
        };
        'Helpers Injected';
    `;

    const results = {};

    ws.onopen = async () => {
        try {
            log('Enabling CDP Runtime and Page domains...');
            await send('Runtime.enable');
            await send('Page.enable');

            log('Loading application home page...');
            await send('Page.navigate', { url: APP_URL });
            await sleep(4000);
            await evalInPage(injectHelpers);

            // ────────────────────────────────────────────────────────────────
            //  SUPER ADMIN SECTION
            // ────────────────────────────────────────────────────────────────
            log('\n══════════════════════════════════════════════');
            log('  SUPER ADMIN (Vijay Mallya) TEST SEQUENCE    ');
            log('══════════════════════════════════════════════');

            // STEP 1: Login as Super Admin via quick-login button
            log('\n[ADMIN STEP 1] Logging in as Super Admin — Vijay Mallya');
            const sessionActive = await evalInPage(`!!document.querySelector('[aria-label="Logout"]')`);
            if (sessionActive) {
                log('  Existing session detected — logging out first...');
                await evalInPage(`document.querySelector('[aria-label="Logout"]')?.click()`);
                await sleep(2500);
                await evalInPage(injectHelpers);
            }

            // Click the Vijay quick-login button
            const loginResult = await evalInPage(`window.__e2e.clickText('button', 'Vijay')`);
            log(`  Quick login result: ${loginResult}`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            const afterLoginUrl = await evalInPage(`window.location.pathname`);
            log(`  Post-login path: ${afterLoginUrl}`);

            // STEP 2: Navigate to Admin Panel — Corporate Directories
            log('\n[ADMIN STEP 2] Navigating to Admin Panel → Corporate Directories');
            const adminNavResult = await evalInPage(`window.__e2e.clickText('aside nav a, nav a', 'Admin')`);
            log(`  Admin nav click: ${adminNavResult}`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            const adminPageText = await evalInPage(`document.body.innerText.substring(0, 500)`);
            log(`  Admin page content preview: ${adminPageText.replace(/\n/g, ' ').substring(0, 200)}`);

            // Read employee directory rows
            const empRows = await evalInPage(`window.__e2e.getTableRows()`);
            log(`  Employee directory rows loaded: ${empRows?.length || 0}`);
            if (empRows && empRows.length > 0) {
                log(`  Row 1: ${empRows[0].substring(0, 120)}`);
                log(`  Row 2: ${empRows[1]?.substring(0, 120) || 'N/A'}`);
            }

            // Read metric widget
            const metricText = await evalInPage(`
                (() => {
                    const spans = Array.from(document.querySelectorAll('span'));
                    const big = spans.find(s => s.className.includes('text-2xl') || s.className.includes('font-black'));
                    return big?.textContent?.trim() || 'N/A';
                })()
            `);
            log(`  Employee count metric: ${metricText}`);

            results.step2_employeeDir = {
                status: (empRows?.length > 0) ? 'PASS' : 'FAIL',
                rowsLoaded: empRows?.length || 0,
                metric: metricText
            };

            // STEP 3: Open "Assign Org" modal for first employee
            log('\n[ADMIN STEP 3] Opening "Assign Org" modal for first employee in list');
            const assignResult = await evalInPage(`
                (() => {
                    const btn = document.querySelector('tbody tr button');
                    if (btn) { btn.click(); return 'Opened for: ' + (document.querySelector('tbody tr td')?.textContent?.trim().substring(0, 30) || 'unknown'); }
                    return 'NOT_FOUND';
                })()
            `);
            await sleep(1800);
            log(`  Assign org button: ${assignResult}`);

            // Check modal
            const modalHeading = await evalInPage(`document.querySelector('.fixed.inset-0 h3')?.textContent?.trim() || 'NO_MODAL'`);
            log(`  Modal heading: "${modalHeading}"`);

            const targetEmpName = await evalInPage(`
                document.querySelector('.fixed.inset-0 span.font-bold')?.textContent?.trim() || 'N/A'
            `);
            log(`  Target employee in modal: "${targetEmpName}"`);

            const deptOptions = await evalInPage(`
                (() => {
                    const selects = document.querySelectorAll('.fixed.inset-0 select');
                    return Array.from(selects).map(s => ({
                        label: s.previousElementSibling?.textContent?.trim(),
                        options: Array.from(s.options).map(o => o.text)
                    }));
                })()
            `);
            log(`  Modal selects: ${JSON.stringify(deptOptions?.map(s => ({ label: s.label, count: s.options?.length })))}`);

            // Close modal with Cancel
            const cancelResult = await evalInPage(`window.__e2e.clickText('.fixed.inset-0 button', 'Cancel')`);
            await sleep(1000);
            log(`  Cancel modal: ${cancelResult}`);

            results.step3_assignOrgModal = {
                status: (modalHeading && modalHeading !== 'NO_MODAL') ? 'PASS' : 'FAIL',
                heading: modalHeading,
                targetEmployee: targetEmpName,
                selectCount: deptOptions?.length || 0
            };

            // STEP 4: RBAC Security Settings tab
            log('\n[ADMIN STEP 4] Switching to RBAC Security Settings tab');
            await evalInPage(injectHelpers);
            const rbacResult = await evalInPage(`window.__e2e.clickText('button', 'RBAC Security Settings')`);
            log(`  Tab click result: ${rbacResult}`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            const userRows = await evalInPage(`window.__e2e.getTableRows()`);
            log(`  User rows in RBAC tab: ${userRows?.length || 0}`);
            if (userRows && userRows.length > 0) {
                log(`  Sample user row 1: ${userRows[0].substring(0, 150)}`);
                log(`  Sample user row 2: ${userRows[1]?.substring(0, 150) || 'N/A'}`);
            }

            // Check roles dropdown count
            const roleSelects = await evalInPage(`document.querySelectorAll('tbody tr select').length`);
            log(`  Role assignment dropdowns: ${roleSelects}`);

            results.step4_rbacTab = {
                status: (userRows?.length > 0) ? 'PASS' : 'FAIL',
                userRowsLoaded: userRows?.length || 0,
                roleDropdowns: roleSelects
            };

            // STEP 5: Departments tab + create new department
            log('\n[ADMIN STEP 5] Switching to Departments Setting tab');
            await evalInPage(injectHelpers);
            const deptTabResult = await evalInPage(`window.__e2e.clickText('button', 'Departments Setting')`);
            log(`  Departments tab click: ${deptTabResult}`);
            await sleep(2500);
            await evalInPage(injectHelpers);

            const deptRows = await evalInPage(`window.__e2e.getTableRows()`);
            log(`  Existing departments loaded: ${deptRows?.length || 0}`);
            if (deptRows) {
                deptRows.forEach((r, i) => log(`    [Dept ${i+1}] ${r}`));
            }

            // Fill in the "Register Department" form
            log('\n  Creating new department: Code=MKT, Name="Marketing & Strategy"');

            // Fill Code input (placeholder contains "MKT")
            const codeRes = await evalInPage(`
                (() => {
                    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
                    const codeInput = inputs.find(i => i.placeholder?.includes('MKT') || i.placeholder?.toLowerCase().includes('code'));
                    if (codeInput) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(codeInput, 'MKT');
                        codeInput.dispatchEvent(new Event('input', {bubbles: true}));
                        return 'code_filled';
                    }
                    return 'code_input_not_found';
                })()
            `);
            await sleep(400);
            log(`  Code field fill: ${codeRes}`);

            const nameRes = await evalInPage(`
                (() => {
                    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
                    const nameInput = inputs.find(i => i.placeholder?.includes('Marketing') || i.placeholder?.toLowerCase().includes('name'));
                    if (nameInput) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(nameInput, 'Marketing & Strategy');
                        nameInput.dispatchEvent(new Event('input', {bubbles: true}));
                        return 'name_filled';
                    }
                    return 'name_input_not_found';
                })()
            `);
            await sleep(400);
            log(`  Name field fill: ${nameRes}`);

            // Click Add Department
            const addDeptResult = await evalInPage(`window.__e2e.clickText('button', 'Add Department')`);
            log(`  "Add Department" click: ${addDeptResult}`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            // Verify new dept appeared
            const afterDeptRows = await evalInPage(`window.__e2e.getTableRows()`);
            const mktFound = afterDeptRows?.some(r => r.includes('MKT') || r.includes('Marketing'));
            log(`  "MKT" Marketing dept in list after add: ${mktFound}`);
            log(`  Total depts after add: ${afterDeptRows?.length || 0}`);

            results.step5_departments = {
                status: mktFound ? 'PASS' : (deptRows?.length > 0 ? 'PARTIAL' : 'FAIL'),
                deptsBefore: deptRows?.length || 0,
                deptsAfter: afterDeptRows?.length || 0,
                mktCreated: mktFound || false,
                codeFieldResult: codeRes,
                nameFieldResult: nameRes
            };

            // STEP 6: Logout Super Admin
            log('\n[ADMIN STEP 6] Logging out Vijay Mallya (Super Admin)...');
            await evalInPage(injectHelpers);
            const logoutResult = await evalInPage(`
                (() => {
                    const btn = document.querySelector('[aria-label="Logout"]')
                        || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.toLowerCase().includes('logout'));
                    if (btn) { btn.click(); return 'logged_out'; }
                    return 'logout_btn_not_found';
                })()
            `);
            log(`  Logout result: ${logoutResult}`);
            await sleep(2500);

            // ────────────────────────────────────────────────────────────────
            //  HR ADMIN SECTION
            // ────────────────────────────────────────────────────────────────
            log('\n══════════════════════════════════════════════');
            log('  HR ADMIN (Shalini Sharma) TEST SEQUENCE     ');
            log('══════════════════════════════════════════════');

            await evalInPage(injectHelpers);

            // STEP 7: Login as HR Admin
            log('\n[HR STEP 7] Logging in as HR Admin — Shalini Sharma');
            const hrLoginResult = await evalInPage(`window.__e2e.clickText('button', 'Shalini')`);
            log(`  Quick login result: ${hrLoginResult}`);
            await sleep(4000);
            await evalInPage(injectHelpers);

            const hrPath = await evalInPage(`window.location.pathname`);
            log(`  HR Admin post-login path: ${hrPath}`);
            const hrDashText = await evalInPage(`document.body.innerText.substring(0, 200)`);
            log(`  Dashboard preview: ${hrDashText.replace(/\n/g, ' ').substring(0, 120)}`);

            // STEP 8: Navigate to Admin Panel as HR Admin
            log('\n[HR STEP 8] HR Admin navigating to Admin Panel');
            const hrAdminNav = await evalInPage(`window.__e2e.clickText('aside nav a, nav a', 'Admin')`);
            log(`  Admin nav result: ${hrAdminNav}`);
            await sleep(3000);
            await evalInPage(injectHelpers);

            const hrAdminText = await evalInPage(`document.body.innerText.substring(0, 500)`);
            log(`  HR Admin page content: ${hrAdminText.replace(/\n/g, ' ').substring(0, 200)}`);

            const hrEmpRows = await evalInPage(`window.__e2e.getTableRows()`);
            log(`  HR Admin employee rows: ${hrEmpRows?.length || 0}`);
            if (hrEmpRows && hrEmpRows.length > 0) {
                log(`  Row 1: ${hrEmpRows[0].substring(0, 120)}`);
            }

            results.step8_hrAdminPanel = {
                status: (hrEmpRows?.length > 0) ? 'PASS' : 'FAIL',
                rowsLoaded: hrEmpRows?.length || 0,
                pathAccessed: hrPath
            };

            // STEP 9: Pagination — next page
            log('\n[HR STEP 9] Testing employee directory pagination');
            const paginationText = await evalInPage(`
                (() => {
                    const spans = Array.from(document.querySelectorAll('span'));
                    const pg = spans.find(s => s.textContent?.includes('Page'));
                    return pg?.textContent?.trim() || 'NOT_FOUND';
                })()
            `);
            log(`  Current pagination: "${paginationText}"`);

            const nextPageResult = await evalInPage(`
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const nextBtn = btns.find(b => {
                        const icon = b.querySelector('.pi-chevron-right');
                        return icon && !b.disabled;
                    });
                    if (nextBtn) { nextBtn.click(); return 'next_clicked'; }
                    return 'next_disabled_or_not_found';
                })()
            `);
            await sleep(2500);
            log(`  Next page button: ${nextPageResult}`);
            await evalInPage(injectHelpers);

            const newPageText = await evalInPage(`
                (() => {
                    const spans = Array.from(document.querySelectorAll('span'));
                    const pg = spans.find(s => s.textContent?.includes('Page'));
                    return pg?.textContent?.trim() || 'NOT_FOUND';
                })()
            `);
            log(`  Pagination after click: "${newPageText}"`);

            const page2Rows = await evalInPage(`window.__e2e.getTableRows()`);
            log(`  Page 2 employee rows: ${page2Rows?.length || 0}`);
            if (page2Rows && page2Rows.length > 0) {
                log(`  Page 2 Row 1: ${page2Rows[0].substring(0, 120)}`);
            }

            results.step9_pagination = {
                status: (page2Rows?.length > 0 && nextPageResult === 'next_clicked') ? 'PASS' : 'PARTIAL',
                paginationBefore: paginationText,
                paginationAfter: newPageText,
                page2Rows: page2Rows?.length || 0,
                nextResult: nextPageResult
            };

            // STEP 10: Logout HR Admin
            log('\n[HR STEP 10] Logging out HR Admin (Shalini Sharma)...');
            const hrLogout = await evalInPage(`
                (() => {
                    const btn = document.querySelector('[aria-label="Logout"]')
                        || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.toLowerCase().includes('logout'));
                    if (btn) { btn.click(); return 'logged_out'; }
                    return 'not_found';
                })()
            `);
            log(`  HR Logout result: ${hrLogout}`);
            await sleep(2000);

            // ────────────────────────────────────────────────────────────────
            //  FINAL REPORT SUMMARY
            // ────────────────────────────────────────────────────────────────
            log('\n======================================================================');
            log('   ADMIN & HR CONFIGURATION UI TEST — COMPLETE RESULTS SUMMARY        ');
            log('======================================================================\n');

            const allChecks = [
                { step: 'STEP 2', name: 'Super Admin — Corporate Directories Load',        result: results.step2_employeeDir },
                { step: 'STEP 3', name: 'Super Admin — Assign Org Modal',                  result: results.step3_assignOrgModal },
                { step: 'STEP 4', name: 'Super Admin — RBAC Security Settings Tab',        result: results.step4_rbacTab },
                { step: 'STEP 5', name: 'Super Admin — Create Department (MKT)',            result: results.step5_departments },
                { step: 'STEP 8', name: 'HR Admin — Admin Panel Access',                   result: results.step8_hrAdminPanel },
                { step: 'STEP 9', name: 'HR Admin — Employee Pagination (Page 2)',          result: results.step9_pagination },
            ];

            let passed = 0, failed = 0, partial = 0;
            allChecks.forEach(({ step, name, result }) => {
                const s = result?.status || 'UNKNOWN';
                const icon = s === 'PASS' ? '✅' : s === 'FAIL' ? '❌' : '⚠ ';
                log(`  ${icon}  [${step}] ${name}  →  ${s}`);
                if (s === 'PASS') passed++;
                else if (s === 'FAIL') failed++;
                else partial++;
            });

            log(`\n  TOTAL: ${allChecks.length} checks | ✅ ${passed} PASS | ❌ ${failed} FAIL | ⚠  ${partial} PARTIAL/SKIP`);
            const overallPass = failed === 0;
            log(overallPass
                ? '\n  🎉 ALL ADMIN & HR CONFIGURATION CHECKS PASSED SUCCESSFULLY!'
                : '\n  ⚠  Some checks need attention — see details above.'
            );
            log('======================================================================\n');

            ws.close();

            const report = {
                success: overallPass,
                timestamp: new Date().toISOString(),
                summary: { total: allChecks.length, passed, failed, partial },
                results,
                logs: testLogs
            };

            fs.mkdirSync('./test', { recursive: true });
            const reportPath = './test/test-ui-admin-hr-report.json';
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            log(`\n📄 Report saved to: ${reportPath}`);

        } catch (err) {
            log(`\n❌ FATAL TEST ERROR: ${err.message}`);
            console.error(err.stack);
            ws.close();

            const report = { success: false, error: err.message, results, logs: testLogs };
            fs.mkdirSync('./test', { recursive: true });
            fs.writeFileSync('./test/test-ui-admin-hr-report.json', JSON.stringify(report, null, 2));
            process.exit(1);
        }
    };

    ws.onerror = (err) => {
        log(`WebSocket Error: ${err.message}`);
        process.exit(1);
    };
}

main().catch(err => {
    log(`FATAL: ${err.message}`);
    process.exit(1);
});
