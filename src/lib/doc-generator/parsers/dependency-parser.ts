import fs from "fs";
import path from "path";

export interface PackageInfo {
  name: string;
  path: string;
  type: "service" | "package" | "app";
  dependencies: string[];
  devDependencies: string[];
  port?: number;
}

export interface DependencyGraph {
  packages: PackageInfo[];
  internalDeps: { from: string; to: string }[];
}

export function parseDependencyGraph(repoPath: string): DependencyGraph {
  const packages: PackageInfo[] = [];
  const internalNames = new Set<string>();

  // Scan services
  const servicesDir = path.join(repoPath, "services");
  if (fs.existsSync(servicesDir)) {
    for (const dir of getSubDirs(servicesDir)) {
      const pkg = readPackageInfo(path.join(servicesDir, dir), "service");
      if (pkg) {
        pkg.port = inferPort(path.join(servicesDir, dir));
        packages.push(pkg);
        internalNames.add(pkg.name);
      }
    }
  }

  // Scan packages
  const packagesDir = path.join(repoPath, "packages");
  if (fs.existsSync(packagesDir)) {
    for (const dir of getSubDirs(packagesDir)) {
      const pkg = readPackageInfo(path.join(packagesDir, dir), "package");
      if (pkg) {
        packages.push(pkg);
        internalNames.add(pkg.name);
      }
    }
  }

  // Scan apps
  const appsDir = path.join(repoPath, "apps");
  if (fs.existsSync(appsDir)) {
    for (const dir of getSubDirs(appsDir)) {
      const pkg = readPackageInfo(path.join(appsDir, dir), "app");
      if (pkg) {
        packages.push(pkg);
        internalNames.add(pkg.name);
      }
    }
  }

  // Build internal dependency edges
  const internalDeps: DependencyGraph["internalDeps"] = [];
  for (const pkg of packages) {
    for (const dep of [...pkg.dependencies, ...pkg.devDependencies]) {
      if (internalNames.has(dep)) {
        internalDeps.push({ from: pkg.name, to: dep });
      }
    }
  }

  return { packages, internalDeps };
}

function readPackageInfo(dir: string, type: PackageInfo["type"]): PackageInfo | null {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return null;

  const raw = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return {
    name: raw.name ?? path.basename(dir),
    path: dir,
    type,
    dependencies: Object.keys(raw.dependencies ?? {}),
    devDependencies: Object.keys(raw.devDependencies ?? {}),
  };
}

function inferPort(serviceDir: string): number | undefined {
  const mainTs = path.join(serviceDir, "src", "main.ts");
  if (!fs.existsSync(mainTs)) return undefined;

  const content = fs.readFileSync(mainTs, "utf-8");
  const portMatch = content.match(/(?:listen|port)\s*\(\s*(\d+)/);
  if (portMatch) return parseInt(portMatch[1], 10);

  const envMatch = content.match(/process\.env\.PORT\s*\|\|\s*(\d+)/);
  if (envMatch) return parseInt(envMatch[1], 10);

  return undefined;
}

function getSubDirs(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
