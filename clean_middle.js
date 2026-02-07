const fs = require('fs');

const filePath = "b:\\save 2740 app\\frontend\\app\\group-contribution\\page.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// We look for a chunk of code that we know exists and might be corrupted invisible chars
// We'll target the end of handleCopyReferral and start of return

const startAnchor = `const handleCopyReferral = () => {`;
const endAnchor = `{/* Desktop Sidebar */}`;

const startIndex = content.indexOf(startAnchor);
const endIndex = content.indexOf(endAnchor);

if (startIndex !== -1 && endIndex !== -1) {
    console.log("Found anchors. Rewriting middle section...");

    const pre = content.substring(0, startIndex);
    const post = content.substring(endIndex); // This starts at {/* Desktop Sidebar */}

    const cleanMiddle = `const handleCopyReferral = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      `;

    // Note: 'post' starts with {/* Desktop... which is inside the div relative to our cleanMiddle?
    // Wait, cleanMiddle ends with <div ...>
    // 'post' starts with {/* Desktop Sidebar */}
    // So combining them:
    // ... overflow-hidden">
    //       {/* Desktop Sidebar */}

    // Seems correct.

    fs.writeFileSync(filePath, pre + cleanMiddle + post);
    console.log("Rewrote middle section.");
} else {
    console.log("Could not find anchors");
    console.log("Start Index:", startIndex);
    console.log("End Index:", endIndex);
}
