const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');

function removeNextCache() {
  if (!fs.existsSync(nextDir)) {
    return;
  }

  try {
    fs.rmSync(nextDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
    console.log('Cleaned stale Next.js cache');
  } catch (error) {
    console.warn(`Could not fully clean .next cache: ${error.message}`);
    console.warn('Close any running Next.js dev server windows and run npm run clean:next if this repeats.');
  }
}

removeNextCache();
