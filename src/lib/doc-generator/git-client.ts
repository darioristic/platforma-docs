import simpleGit, { type SimpleGit, type LogResult } from "simple-git";
import fs from "fs";
import path from "path";

const REPO_CACHE_DIR = path.join(process.cwd(), ".repo-cache");

export interface GitClientOptions {
  repoUrl: string;
  token?: string;
  branch?: string;
}

export class GitClient {
  private git: SimpleGit;
  private repoPath: string;
  private repoUrl: string;
  private branch: string;

  constructor(options: GitClientOptions) {
    this.branch = options.branch ?? "main";

    // Inject token into URL for private repos
    if (options.token && options.repoUrl.startsWith("https://")) {
      this.repoUrl = options.repoUrl.replace(
        "https://",
        `https://${options.token}@`
      );
    } else {
      this.repoUrl = options.repoUrl;
    }

    this.repoPath = REPO_CACHE_DIR;
    this.git = simpleGit();
  }

  async ensureRepo(): Promise<string> {
    if (fs.existsSync(path.join(this.repoPath, ".git"))) {
      // Repo exists — pull latest
      this.git = simpleGit(this.repoPath);
      await this.git.fetch("origin", this.branch);
      await this.git.checkout(this.branch);
      await this.git.pull("origin", this.branch);
    } else {
      // Clone fresh
      fs.mkdirSync(this.repoPath, { recursive: true });
      await this.git.clone(this.repoUrl, this.repoPath, [
        "--branch",
        this.branch,
        "--depth",
        "100",
      ]);
      this.git = simpleGit(this.repoPath);
    }

    return this.repoPath;
  }

  async getLatestCommitHash(): Promise<string> {
    this.git = simpleGit(this.repoPath);
    const log = await this.git.log({ maxCount: 1 });
    return log.latest?.hash ?? "unknown";
  }

  async getLog(since?: string, paths?: string[]): Promise<LogResult> {
    this.git = simpleGit(this.repoPath);
    const options: Record<string, string | undefined> = {};
    if (since) {
      options["--since"] = since;
    }
    return this.git.log({
      ...options,
      file: paths?.join(" "),
    });
  }

  async getDiff(fromHash: string, toHash: string = "HEAD"): Promise<string> {
    this.git = simpleGit(this.repoPath);
    return this.git.diff([fromHash, toHash, "--stat"]);
  }

  getRepoPath(): string {
    return this.repoPath;
  }
}
