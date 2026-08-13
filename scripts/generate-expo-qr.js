const fs = require("node:fs");
const path = require("node:path");

const workspaceRoot = path.resolve(__dirname, "..");
const storeRoot = path.join(workspaceRoot, "node_modules", ".pnpm");
const qrPackage = fs
  .readdirSync(storeRoot)
  .find((entry) => entry.startsWith("qrcode-terminal@"));

if (!qrPackage) {
  throw new Error("qrcode-terminal dependency was not found.");
}

const vendorRoot = path.join(
  storeRoot,
  qrPackage,
  "node_modules",
  "qrcode-terminal",
  "vendor",
  "QRCode",
);
const QRCode = require(vendorRoot);
const QRErrorCorrectLevel = require(path.join(
  vendorRoot,
  "QRErrorCorrectLevel",
));

const target = process.argv[2] || "exp://192.168.10.22:8082";
const outputPath = process.argv[3] || path.join(workspaceRoot, "mobile", "expo-go-qr.svg");
const qr = new QRCode(-1, QRErrorCorrectLevel.M);
qr.addData(target);
qr.make();

const margin = 4;
const scale = 12;
const modules = qr.getModuleCount();
const size = (modules + margin * 2) * scale;
const cells = [];

for (let row = 0; row < modules; row += 1) {
  for (let column = 0; column < modules; column += 1) {
    if (qr.isDark(row, column)) {
      cells.push(
        `<rect x="${(column + margin) * scale}" y="${(row + margin) * scale}" width="${scale}" height="${scale}"/>`,
      );
    }
  }
}

const svg = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
  `<rect width="100%" height="100%" fill="#ffffff"/>`,
  `<g fill="#142a48">`,
  ...cells,
  `</g>`,
  `</svg>`,
].join("\n");

fs.writeFileSync(outputPath, svg, "utf8");
console.log(`${outputPath}\n${target}\n${modules} modules`);
