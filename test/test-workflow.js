const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:8080';

// Global console logs collector for the report
const testLogs = [];
function log(msg) {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${msg}`;
    testLogs.push(formatted);
    console.log(formatted);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(endpoint, options = {}) {
    const url = `${BACKEND_URL}${endpoint}`;
    if (!options.headers) options.headers = {};
    options.headers['Content-Type'] = 'application/json';
    
    const response = await fetch(url, options);
    
    if (response.status === 204) {
        return null;
    }
    
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status} on ${options.method || 'GET'} ${endpoint}: ${text}`);
    }
    
    if (!text || text.trim() === '') {
        return null;
    }
    
    return JSON.parse(text);
}

async function runTest() {
    log('--- STARTING SYSTEM INTEGRATION TEST FOR WORKFLOW ENGINE ---');
    
    try {
        // Step 1: Rohan (Employee) Logs In
        log('Step 1: Logging in as Rohan Sharma (Employee)...');
        const rohanAuth = await fetchJson('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'rohan.sharma@ess.com',
                password: 'Password@123'
            })
        });
        
        const rohanToken = rohanAuth.token;
        log(`Rohan login successful. Token acquired. Employee ID: ${rohanAuth.employeeId}`);

        // Step 2: Fetch Initial Leave Balances for Rohan
        log('Step 2: Fetching Rohan\'s leave balances...');
        const rohanBalancesBefore = await fetchJson('/api/leaves/balances', {
            headers: { 'Authorization': `Bearer ${rohanToken}` }
        });
        
        const clBalanceBefore = rohanBalancesBefore.find(b => b.leaveTypeCode === 'CL');
        log(`Initial CL Balance: Available=${clBalanceBefore.available}, Used=${clBalanceBefore.used}, Pending=${clBalanceBefore.pending}`);

        // Step 3: Rohan Applies for a Leave Request
        const leaveStartDate = '2026-07-01';
        const leaveEndDate = '2026-07-03';
        log(`Step 3: Rohan applying for Casual Leave (CL) from ${leaveStartDate} to ${leaveEndDate}...`);
        
        const leaveRequest = await fetchJson('/api/leaves/request', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${rohanToken}` },
            body: JSON.stringify({
                leaveTypeId: 1, // Casual Leave
                startDate: leaveStartDate,
                endDate: leaveEndDate,
                reason: 'Family urgent personal function - Automated Workflow Integration Test'
            })
        });
        
        log(`Leave request submitted successfully. Request ID: ${leaveRequest.id}, Status: ${leaveRequest.status}`);
        
        // Step 4: Verify Rohan's Pending Balance is updated
        log('Step 4: Verifying Rohan\'s pending leave balance updated...');
        const rohanBalancesMiddle = await fetchJson('/api/leaves/balances', {
            headers: { 'Authorization': `Bearer ${rohanToken}` }
        });
        const clBalanceMiddle = rohanBalancesMiddle.find(b => b.leaveTypeCode === 'CL');
        log(`Middle CL Balance: Available=${clBalanceMiddle.available}, Used=${clBalanceMiddle.used}, Pending=${clBalanceMiddle.pending}`);

        // Step 5: Devendra (Manager) Logs In
        log('Step 5: Logging in as Devendra Singh (Rohan\'s Reporting Manager)...');
        const devendraAuth = await fetchJson('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'devendra.singh@ess.com',
                password: 'Password@123'
            })
        });
        
        const devendraToken = devendraAuth.token;
        log('Devendra login successful. Token acquired.');

        // Step 6: Devendra fetches pending tasks and finds Rohan's task
        log('Step 6: Fetching Devendra\'s pending inbox workflow tasks...');
        const pendingTasks = await fetchJson('/api/workflow/tasks/pending', {
            headers: { 'Authorization': `Bearer ${devendraToken}` }
        });
        
        log(`Fetched ${pendingTasks.length} pending task(s) for Devendra.`);
        
        // Find Rohan's leave task
        const rohanTask = pendingTasks.find(t => t.workflowInstance.entityId === leaveRequest.id);
        if (!rohanTask) {
            throw new Error(`Rohan's leave request task (ID: ${leaveRequest.id}) not found in Devendra's inbox!`);
        }
        
        log(`Found Rohan's pending task. Task ID: ${rohanTask.id}, Status: ${rohanTask.status}, Step: ${rohanTask.stepNumber}`);

        // Step 7: Devendra Approves Rohan's Leave Request
        log(`Step 7: Devendra approving Rohan's task (Task ID: ${rohanTask.id})...`);
        await fetchJson('/api/workflow/tasks/action', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${devendraToken}` },
            body: JSON.stringify({
                workflowTaskId: rohanTask.id,
                action: 'APPROVE',
                comment: 'Approved by automated system integration testing. Enjoy the time off!'
            })
        });
        
        log('Task action processed successfully.');

        // Step 8: Verify Rohan's Leave Request is APPROVED
        log('Step 8: Verifying leave request status updated to APPROVED...');
        const finalLeaveRequest = await fetchJson(`/api/leaves/${leaveRequest.id}`, {
            headers: { 'Authorization': `Bearer ${rohanToken}` }
        });
        
        log(`Final Leave Request Status: ${finalLeaveRequest.status}`);
        if (finalLeaveRequest.status !== 'APPROVED') {
            throw new Error(`Expected leave request status to be APPROVED, but got: ${finalLeaveRequest.status}`);
        }

        // Step 9: Verify Rohan's Final Balances (Used updated, Pending restored)
        log('Step 9: Verifying Rohan\'s final balances (Used deduction)...');
        const rohanBalancesAfter = await fetchJson('/api/leaves/balances', {
            headers: { 'Authorization': `Bearer ${rohanToken}` }
        });
        const clBalanceAfter = rohanBalancesAfter.find(b => b.leaveTypeCode === 'CL');
        log(`Final CL Balance: Available=${clBalanceAfter.available}, Used=${clBalanceAfter.used}, Pending=${clBalanceAfter.pending}`);
        
        if (clBalanceAfter.used !== clBalanceBefore.used + 3) {
            throw new Error(`Expected used balance to increase by 3. Before: ${clBalanceBefore.used}, After: ${clBalanceAfter.used}`);
        }
        
        log('=== INTEGRATION TEST PASSED SUCCESSFULLY! WORKFLOW ENGINE WORKING FLAWLESSLY ===');
        
        // Write report
        const report = {
            success: true,
            timestamp: new Date().toISOString(),
            logs: testLogs,
            data: {
                initialBalance: clBalanceBefore,
                leaveRequestId: leaveRequest.id,
                taskApprovedId: rohanTask.id,
                finalBalance: clBalanceAfter
            }
        };
        fs.writeFileSync(path.join(__dirname, 'integration-test-report.json'), JSON.stringify(report, null, 2));
        
    } catch (error) {
        log(`!!! INTEGRATION TEST FAILED !!!`);
        log(`Error details: ${error.message}`);
        
        const report = {
            success: false,
            timestamp: new Date().toISOString(),
            logs: testLogs,
            error: error.message
        };
        fs.writeFileSync(path.join(__dirname, 'integration-test-report.json'), JSON.stringify(report, null, 2));
        process.exit(1);
    }
}

runTest();
