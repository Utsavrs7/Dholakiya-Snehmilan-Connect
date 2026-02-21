/* global require, __dirname, process */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Admin/SuperQuickActionsPage.jsx');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Define the start of the block we want to remove
    const startMarker = `                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">Title</label>
                  <input
                    value={heroForm.title}`;

    // This is the start of the NEXT block we want to keep
    const endMarker = `                <div>
                  <label className="text-sm font-medium text-[#7a1f1f]/90">
                    Upload Image
                  </label>`;

    const startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
        console.log("Target block not found. Asking for manual check.");
        process.exit(1);
    }

    // Find the end marker *after* the start index
    const endIndex = content.indexOf(endMarker, startIndex);

    if (endIndex === -1) {
        console.log("End marker not found.");
        process.exit(1);
    }

    // Construct new content: everything before start + everything from end
    const newContent = content.substring(0, startIndex) + content.substring(endIndex);

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("File updated successfully.");

} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
