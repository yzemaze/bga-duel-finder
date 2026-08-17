const fs = require("fs");
const path = require("path");

const SOURCE_FILE = path.join(__dirname, "./src/finder.js");
const TARGET_FILE = path.join(__dirname, "README.md");

function updateBookmarklet() {
    try {
        let sourceCode = fs.readFileSync(SOURCE_FILE, "utf8");

        sourceCode = sourceCode.replace(/\/\*[\s\S]*?\*\//g, "");
        sourceCode = sourceCode
            .split("\n")
            .filter(line => !line.trim().startsWith("//"))
            .join("\n")
            .trim();

        const encoded = "javascript:" + encodeURIComponent(sourceCode);
        let readme = fs.readFileSync(TARGET_FILE, "utf8");
        const regex = /javascript:[a-zA-Z0-9%._~!( )*'-]*/g;

        if (regex.test(readme)) {
            const updatedReadme = readme.replace(regex, encoded);
            
            if (readme !== updatedReadme) {
                fs.writeFileSync(TARGET_FILE, updatedReadme, "utf8");
                console.log("[RF] README.md successfully updated with the wrapped source code.");
            } else {
                console.log("[RF] README.md is already up to date.");
            }
        } else {
            console.error("[RF] Error: Could not find an existing 'javascript:...' link in README.md");
            process.exit(1);
        }
    } catch (err) {
        console.error("[RF] Error:", err.message);
        process.exit(1);
    }
}

updateBookmarklet();