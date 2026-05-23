const { spawn } = require('child_process');
const path = require('path');

// Colors
const COLOR_RESET = '\x1b[0m';
const COLOR_BACKEND = '\x1b[32m'; // Green
const COLOR_FRONTEND = '\x1b[36m'; // Cyan
const COLOR_ERROR = '\x1b[31m'; // Red
const COLOR_SYSTEM = '\x1b[35m'; // Magenta

console.log(`${COLOR_SYSTEM}======================================================================${COLOR_RESET}`);
console.log(`${COLOR_SYSTEM}        Employee Self Service Portal (ESS Portal) Launch Suite        ${COLOR_RESET}`);
console.log(`${COLOR_SYSTEM}======================================================================${COLOR_RESET}\n`);

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

const mvnPath = path.join(backendDir, 'apache-maven-3.9.6', 'bin', 'mvn.cmd');

console.log(`${COLOR_SYSTEM}[System] Launching Spring Boot Backend...${COLOR_RESET}`);
const backend = spawn(mvnPath, ['spring-boot:run'], {
    cwd: backendDir,
    shell: true,
    stdio: 'pipe'
});

console.log(`${COLOR_SYSTEM}[System] Launching Angular 21 Frontend...${COLOR_RESET}`);
const frontend = spawn('npm', ['run', 'start'], {
    cwd: frontendDir,
    shell: true,
    stdio: 'pipe'
});

const formatOutput = (prefix, color, data) => {
    const text = data.toString();
    const lines = text.split('\n');
    lines.forEach(line => {
        if (line.trim().length > 0) {
            console.log(`${color}${prefix}${COLOR_RESET} ${line}`);
        }
    });
};

backend.stdout.on('data', (data) => formatOutput('[Backend]', COLOR_BACKEND, data));
backend.stderr.on('data', (data) => formatOutput('[Backend-Error]', COLOR_ERROR, data));

frontend.stdout.on('data', (data) => formatOutput('[Frontend]', COLOR_FRONTEND, data));
frontend.stderr.on('data', (data) => formatOutput('[Frontend-Error]', COLOR_ERROR, data));

const handleShutdown = () => {
    console.log(`\n${COLOR_SYSTEM}[System] Shutting down services cleanly...${COLOR_RESET}`);

    if (backend) {
        console.log(`${COLOR_SYSTEM}[System] Terminating Spring Boot Backend process...${COLOR_RESET}`);
        backend.kill('SIGINT');
    }
    if (frontend) {
        console.log(`${COLOR_SYSTEM}[System] Terminating Angular Frontend process...${COLOR_RESET}`);
        frontend.kill('SIGINT');
    }

    setTimeout(() => {
        console.log(`${COLOR_SYSTEM}[System] All processes stopped. Goodbye!${COLOR_RESET}`);
        process.exit(0);
    }, 1500);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

backend.on('close', (code) => {
    if (code !== null) {
        console.log(`${COLOR_ERROR}[Backend] Process exited with code ${code}${COLOR_RESET}`);
    }
});

frontend.on('close', (code) => {
    if (code !== null) {
        console.log(`${COLOR_ERROR}[Frontend] Process exited with code ${code}${COLOR_RESET}`);
    }
});
