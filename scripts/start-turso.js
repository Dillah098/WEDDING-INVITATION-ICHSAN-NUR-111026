const { execSync } = require('child_process');
const { spawn } = require('child_process');
const path = require('path');

const DB_NAME = 'undangan-ichasan-nur';

function runCli(args) {
  return execSync(`turso ${args}`, { encoding: 'utf8' }).trim();
}

const dbInfo = runCli(`db show ${DB_NAME}`);
const urlMatch = dbInfo.match(/URL:\s+(\S+)/);
if (!urlMatch) {
  console.error('Could not parse Turso database URL');
  process.exit(1);
}
const TURSO_URL = urlMatch[1];

const TURSO_TOKEN = runCli(`db tokens create ${DB_NAME}`);

const serverPath = path.join(__dirname, '..', 'server.js');
const child = spawn('node', [serverPath], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    TURSO_DATABASE_URL: TURSO_URL,
    TURSO_AUTH_TOKEN: TURSO_TOKEN,
  },
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code));
