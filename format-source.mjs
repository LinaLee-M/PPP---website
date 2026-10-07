// Optional source formatting helper. No dependencies or changes to behaviour.
import fs from "node:fs";
const file = new URL("dist/styles.css", import.meta.url);
let source = fs.readFileSync(file, "utf8");
// Keep all six-digit colours neutral, like the supplied grayscale reference.
function neutralColour(match) {
  const channels = [1, 3, 5].map(offset => parseInt(match.slice(offset, offset + 2), 16));
  const gray = Math.round(channels.reduce((sum, value) => sum + value, 0) / 3).toString(16).padStart(2, "0");
  return `#${gray.repeat(3)}${match.slice(7)}`;
}
source = source.replace(/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi, neutralColour);
source = source.replace(/\/\* Keep the complete palette neutral,[\s\S]*$/, "");
let depth = 0;
let output = "";
let buffer = "";
let quote = "";
let comment = false;
function flush() {
  if (buffer.trim()) output += `${"  ".repeat(depth)}${buffer.trim()}\n`;
  buffer = "";
}
for (let index = 0; index < source.length; index++) {
  const character = source[index];
  if (comment) {
    buffer += character;
    if (character === "/" && source[index - 1] === "*") { comment = false; flush(); }
    continue;
  }
  if (!quote && character === "/" && source[index + 1] === "*") { flush(); comment = true; buffer += character; continue; }
  if (quote) {
    buffer += character;
    if (character === quote && source[index - 1] !== "\\") quote = "";
    continue;
  }
  if (character === "\"" || character === "'") { quote = character; buffer += character; continue; }
  if (character === "{") { buffer += " {"; flush(); depth++; }
  else if (character === "}") { flush(); depth--; output += `${"  ".repeat(depth)}}\n\n`; }
  else if (character === ";") { buffer += ";"; flush(); }
  else buffer += character;
}
flush();
fs.writeFileSync(file, output);
const appFile = new URL("dist/app.js", import.meta.url);
fs.writeFileSync(appFile, fs.readFileSync(appFile, "utf8").replace(/#[0-9a-f]{6}\b/gi, neutralColour));
console.log("Styles formatted and palette made neutral.");
