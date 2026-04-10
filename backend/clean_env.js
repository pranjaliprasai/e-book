import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
let content = fs.readFileSync(envPath, 'utf8');

// Function to clean a line
function cleanKey(line) {
    if (!line.includes('KHALTI_')) return line;
    const [key, value] = line.split('=');
    if (!value) return line;
    // Remove quotes, spaces, and any non-printable characters
    const cleanedValue = value.trim().replace(/['"]/g, '').replace(/[^\x20-\x7E]/g, '');
    console.log(`Cleaned ${key}: ${cleanedValue.substring(0, 15)}... (Length: ${cleanedValue.length})`);
    return `${key}=${cleanedValue}`;
}

const lines = content.split(/\r?\n/);
const cleanedLines = lines.map(cleanKey);

fs.writeFileSync(envPath, cleanedLines.join('\n'));
console.log(".env cleaned successfully!");
