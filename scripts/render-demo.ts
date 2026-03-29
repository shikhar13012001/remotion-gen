import { execSync } from "child_process";
import * as fs   from "fs";
import * as path from "path";

const outDir  = path.resolve(__dirname, "../out");
const outFile = path.join(outDir, "demo.mp4");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log("Rendering DemoComposition → out/demo.mp4 …\n");
execSync(
  `npx remotion render DemoComposition "${outFile}"`,
  { stdio: "inherit", cwd: path.resolve(__dirname, "..") },
);
console.log(`\nDone → ${outFile}`);
