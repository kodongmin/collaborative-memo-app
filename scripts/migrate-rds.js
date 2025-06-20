const { exec } = require('child_process');
require('dotenv').config();

const { DB_HOST, DB_USER, DB_NAME, DB_PASSWORD } = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME || !DB_PASSWORD) {
  console.error('❌ Missing database environment variables. Please check your .env file.');
  process.exit(1);
}

// PowerShell on Windows requires a specific way to set env vars for a command
const command = `$env:PGPASSWORD="${DB_PASSWORD}"; psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -f database.sql`;

console.log(`🔄 Running migration on RDS host: ${DB_HOST}...`);

const child = exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Migration failed:`);
    // psql error messages often go to stderr
    if (stderr) {
      console.error(stderr);
    }
    console.log("\nHint: Make sure 'psql' is in your system's PATH and that you are connected to the internet/VPN if required.");
    return;
  }
  console.log(`✅ Migration successful!`);
  if (stdout) {
    console.log(stdout);
  }
});

child.on('exit', (code) => {
    if (code !== 0) {
        console.error(`Migration script exited with code ${code}.`);
    }
}); 