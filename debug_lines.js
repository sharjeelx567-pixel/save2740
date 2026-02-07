const fs = require('fs');
const filePath = "b:\\save 2740 app\\frontend\\app\\group-contribution\\page.tsx";
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("Inspecting lines 420-435:");
for (let i = 420; i < 435; i++) {
    if (lines[i] !== undefined) {
        console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
    }
}
