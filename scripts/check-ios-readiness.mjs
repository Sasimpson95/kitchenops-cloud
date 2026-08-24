import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredFiles = [
  "capacitor.config.ts",
  "package.json",
  "release/ios/APP-STORE-METADATA.md",
  "release/ios/APP-PRIVACY.md",
  "release/ios/APP-STORE-REVIEW-CHECKLIST.md",
  "release/ios/IOS-BUILD-PLAN.md",
  "release/ios/SCREENSHOT-PLAN.md",
  "release/ios/branding/IOS-BRANDING-PLAN.md",
];

let failed = false;

function pass(message) {
  console.log(`✓ ${message}`);
}

function fail(message) {
  console.error(`✗ ${message}`);
  failed = true;
}

console.log("\nKitchenOps iOS Readiness Check\n");

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);

  if (fs.existsSync(fullPath)) {
    pass(`${file} exists`);
  } else {
    fail(`${file} is missing`);
  }
}

const packagePath = path.join(root, "package.json");

if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  const capacitorCore = pkg.dependencies?.["@capacitor/core"];
  const capacitorIos = pkg.dependencies?.["@capacitor/ios"];
  const capacitorAndroid = pkg.dependencies?.["@capacitor/android"];
  const capacitorCli = pkg.devDependencies?.["@capacitor/cli"];

  if (capacitorCore) pass(`@capacitor/core found: ${capacitorCore}`);
  else fail("@capacitor/core is missing");

  if (capacitorIos) pass(`@capacitor/ios found: ${capacitorIos}`);
  else fail("@capacitor/ios is missing");

  if (capacitorAndroid) pass(`@capacitor/android found: ${capacitorAndroid}`);
  else fail("@capacitor/android is missing");

  if (capacitorCli) pass(`@capacitor/cli found: ${capacitorCli}`);
  else fail("@capacitor/cli is missing");
}

const capacitorPath = path.join(root, "capacitor.config.ts");

if (fs.existsSync(capacitorPath)) {
  const config = fs.readFileSync(capacitorPath, "utf8");

  if (config.includes("com.kitchenops.app")) {
    pass("Bundle ID is com.kitchenops.app");
  } else {
    fail("Expected bundle ID com.kitchenops.app not found");
  }

  if (config.includes("appName: 'KitchenOps'")) {
    pass("App name is KitchenOps");
  } else {
    fail("Expected app name KitchenOps not found");
  }

  if (config.includes("https://app.kitchenops.co.uk/login")) {
    pass("Production KitchenOps URL configured");
  } else {
    fail("Production KitchenOps URL is not configured");
  }

  if (
    config.includes("localhost") ||
    config.includes("kitchenops-cloud.vercel.app")
  ) {
    fail("Development or old Vercel URL found in Capacitor config");
  }
}

console.log("");

if (failed) {
  console.error("KitchenOps is NOT ready for the iOS build stage.\n");
  process.exit(1);
}

console.log("KitchenOps iOS preparation checks passed.\n");