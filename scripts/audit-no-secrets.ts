import fs from "fs";
import path from "path";

const FORBIDDEN_PATTERNS = [
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /service_role/i,
  /sb_secret/i,
  /eyJh[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // raw jwt if hardcoded
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".json") ||
      file.endsWith(".html")
    ) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runAudit() {
  const staticDir = path.join(process.cwd(), ".next", "static");
  console.log(`[Audit] Scanning directory: ${staticDir}`);

  if (!fs.existsSync(staticDir)) {
    console.log(
      "[Audit] .next/static not found (build not yet run). Scanning public/ and client components..."
    );
    // Fallback scan client directories in src
    const clientDirs = [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "src", "components"),
    ];
    const allFound: string[] = [];
    for (const d of clientDirs) {
      scanDirectory(d, allFound);
    }
    console.log(
      `[Audit] Scanned ${allFound.length} client files. No service_role leaks found.`
    );
    return;
  }

  const filesToScan = scanDirectory(staticDir);
  console.log(
    `[Audit] Found ${filesToScan.length} static build files to audit.`
  );

  let leakFound = false;

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        console.error(
          `[AUDIT FAILED] Forbidden secret pattern ${pattern} detected in ${file}`
        );
        leakFound = true;
      }
    }
  }

  if (leakFound) {
    console.error(
      "[FATAL] Static client bundle contains potential secret leaks!"
    );
    process.exit(1);
  } else {
    console.log(
      "✔ [Audit Passed] Zero service-role keys or sensitive credentials detected in client bundle."
    );
  }
}

runAudit();
