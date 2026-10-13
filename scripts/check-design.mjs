// Vérifie la règle du design system : aucune couleur, ombre, dégradé ni radius en dur
// dans les composants. Les couleurs de *données* (états, labels) vivent dans lib/ et la BDD.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components"];
const ALLOWED_RADIUS = new Set(["components/issues/state-dot.tsx"]);

const RULES = [
  { re: /#[0-9a-fA-F]{3,8}\b/, msg: "couleur hexadécimale en dur" },
  { re: /\b(?:rgba?|hsla?|oklch)\(/, msg: "couleur en dur" },
  { re: /\brounded(?:-[a-z]+)?\b/, msg: "border-radius (radius 0 partout)", radius: true },
  { re: /border-radius/, msg: "border-radius (radius 0 partout)", radius: true },
  { re: /\b(?:shadow|drop-shadow)-/, msg: "ombre portée interdite" },
  { re: /\b(?:bg-gradient|bg-linear|bg-radial|linear-gradient)/, msg: "dégradé interdit" },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(tsx?|css)$/.test(name) && !path.endsWith("globals.css")) yield path;
  }
}

const errors = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.trimStart().startsWith("//")) return;
        for (const rule of RULES) {
          if (rule.radius && ALLOWED_RADIUS.has(file)) continue;
          if (rule.re.test(line)) errors.push(`${file}:${i + 1}  ${rule.msg}\n    ${line.trim()}`);
        }
      });
  }
}

if (errors.length) {
  console.error(`✗ Design system : ${errors.length} violation(s)\n\n${errors.join("\n")}`);
  process.exit(1);
}
console.log("✓ Design system : aucune couleur ni radius en dur");
