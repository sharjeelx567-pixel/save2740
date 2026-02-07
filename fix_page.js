const fs = require('fs');
const path = require('path');

const filePath = "b:\\save 2740 app\\frontend\\app\\group-contribution\\page.tsx";

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // The broken pattern we observed
    // We use a flexible regex to catch the spacing
    const brokenPattern = /<\/Card\s*>\s*<\/div\s*>\s*<\/div\s*>\s*<>\s*\)\s*}/;

    // The previous attempt likely failed because of newlines.
    // Let's look for the text block specifically.

    const targetBlock = `                    </Card >
                </div >
              </div >
            </>
          )
}`;

    // Fix replacement
    const replacement = `                    </Card>
                </div>
              </div>
            </>
          )}`;

    if (content.includes(targetBlock)) {
        console.log("Found specific block strings. Replacing...");
        content = content.replace(targetBlock, replacement);
        fs.writeFileSync(filePath, content);
        console.log("Fixed main block.");
    } else {
        console.log("Could not find exact string block. Trying loose replacement...");
        // Fallback: Replace the "Recent Transactions" section end manually
        // Locate "Recent Transactions"
        const idx = content.indexOf('Recent Transactions');
        if (idx !== -1) {
            // We can find the end of the file logic
            // But simpler: let's look for the weird spaced tags
            const weirdTag = "</Card >";
            if (content.includes(weirdTag)) {
                content = content.replace(/<\/Card >/g, "</Card>");
                content = content.replace(/<\/div >/g, "</div>");
                content = content.replace(/< Sheet/g, "<Sheet");
                content = content.replace(/< Card/g, "<Card");

                // Fix the accidental function closure
                // Look for "}\n          </div >"
                content = content.replace(/}\s*<\/div >/g, ")}</div>"); // This puts back the ) and removes the extra }??

                // Actually, the pattern was:
                // )
                // }
                // </div>

                // We want:
                // )}
                // </div>

                // And we need to remove the extra brace if it closed the function

                fs.writeFileSync(filePath, content);
                console.log("Applied regex fixes.");
            }
        }
    }

} catch (e) {
    console.error("Error:", e);
}
