const fs = require('fs');
const filePath = "b:\\save 2740 app\\frontend\\app\\group-contribution\\page.tsx";
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('const handleCopyReferral = () => {');
const endIdx = content.indexOf('{/* Desktop Sidebar */}');

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);

    const replacement = `  const handleCopyReferral = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      `;

    fs.writeFileSync(filePath, before + replacement + after);
    console.log("Rewrote handleCopyReferral and return statement.");
} else {
    console.log("Anchors not found.");
}
