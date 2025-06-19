const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'docs', 'screenshots');
const files = fs.readdirSync(screenshotsDir)
  .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
  .sort();

console.log('## 🖼️ Screenshots\n');
console.log('Below are some key screens and features of MyWorkManagement:\n');

files.forEach(file => {
  // Convert filename to a nice title: e.g. "billing-modal.png" => "Billing Modal"
  const base = path.basename(file, path.extname(file));
  const title = base
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  console.log(`### ${title}\n![${title}](docs/screenshots/${file})\n`);
});