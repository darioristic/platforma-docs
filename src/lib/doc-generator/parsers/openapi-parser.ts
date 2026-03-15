import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import fs from "fs";

export interface ApiEndpointInfo {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: ApiParamInfo[];
  requestBody?: ApiBodyInfo;
  responses: ApiResponseInfo[];
  auth?: string;
}

export interface ApiParamInfo {
  name: string;
  in: "query" | "path" | "header";
  type: string;
  required: boolean;
  description?: string;
}

export interface ApiBodyInfo {
  type: string;
  properties: { name: string; type: string; required: boolean; description?: string }[];
}

export interface ApiResponseInfo {
  status: number;
  description?: string;
  type?: string;
}

export interface ServiceApiInfo {
  serviceName: string;
  basePath: string;
  endpoints: ApiEndpointInfo[];
}

const HTTP_METHODS = ["Get", "Post", "Put", "Patch", "Delete"] as const;

export function parseServiceApis(repoPath: string): ServiceApiInfo[] {
  const servicesDir = path.join(repoPath, "services");
  if (!fs.existsSync(servicesDir)) return [];

  const services: ServiceApiInfo[] = [];
  const serviceDirs = fs.readdirSync(servicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith("-service"));

  for (const serviceDir of serviceDirs) {
    const servicePath = path.join(servicesDir, serviceDir.name);
    const srcPath = path.join(servicePath, "src");
    if (!fs.existsSync(srcPath)) continue;

    const endpoints = parseControllers(srcPath, serviceDir.name);
    if (endpoints.length > 0) {
      services.push({
        serviceName: serviceDir.name,
        basePath: inferBasePath(servicePath),
        endpoints,
      });
    }
  }

  return services;
}

function inferBasePath(servicePath: string): string {
  const mainTs = path.join(servicePath, "src", "main.ts");
  if (!fs.existsSync(mainTs)) return "/api";

  const content = fs.readFileSync(mainTs, "utf-8");
  const prefixMatch = content.match(/setGlobalPrefix\(['"]([^'"]+)['"]\)/);
  return prefixMatch ? `/${prefixMatch[1]}` : "/api";
}

function parseControllers(srcPath: string, serviceName: string): ApiEndpointInfo[] {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const endpoints: ApiEndpointInfo[] = [];

  // Find all controller files
  const controllerFiles = findFiles(srcPath, ".controller.ts");

  for (const filePath of controllerFiles) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const classes = sourceFile.getClasses();

    for (const cls of classes) {
      const controllerDec = cls.getDecorator("Controller");
      if (!controllerDec) continue;

      const controllerPath = extractDecoratorStringArg(controllerDec) ?? "";
      const apiTags = extractDecoratorStringArg(cls.getDecorator("ApiTags"));

      // Parse each method
      for (const method of cls.getMethods()) {
        for (const httpMethod of HTTP_METHODS) {
          const httpDec = method.getDecorator(httpMethod);
          if (!httpDec) continue;

          const methodPath = extractDecoratorStringArg(httpDec) ?? "";
          const fullPath = `/${controllerPath}/${methodPath}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

          const apiOp = method.getDecorator("ApiOperation");
          const summary = extractDecoratorObjectProp(apiOp, "summary");
          const description = extractDecoratorObjectProp(apiOp, "description");

          // Parse parameters from decorators
          const params: ApiParamInfo[] = [];
          for (const param of method.getParameters()) {
            const queryDec = param.getDecorator("Query");
            const paramDec = param.getDecorator("Param");

            if (queryDec) {
              params.push({
                name: extractDecoratorStringArg(queryDec) ?? param.getName(),
                in: "query",
                type: param.getType().getText() ?? "string",
                required: !param.hasQuestionToken(),
              });
            }
            if (paramDec) {
              params.push({
                name: extractDecoratorStringArg(paramDec) ?? param.getName(),
                in: "path",
                type: param.getType().getText() ?? "string",
                required: true,
              });
            }
          }

          // Parse request body
          let requestBody: ApiBodyInfo | undefined;
          const bodyParam = method.getParameters().find((p) => p.getDecorator("Body"));
          if (bodyParam) {
            const bodyType = bodyParam.getType();
            const properties = bodyType.getProperties().map((prop) => ({
              name: prop.getName(),
              type: prop.getTypeAtLocation(sourceFile).getText() ?? "unknown",
              required: !prop.isOptional(),
            }));
            requestBody = {
              type: bodyType.getText() ?? "object",
              properties,
            };
          }

          // Parse responses
          const responses: ApiResponseInfo[] = [];
          for (const dec of method.getDecorators()) {
            if (dec.getName() === "ApiResponse") {
              const status = extractDecoratorObjectProp(dec, "status");
              const desc = extractDecoratorObjectProp(dec, "description");
              if (status) {
                responses.push({
                  status: parseInt(status, 10),
                  description: desc ?? undefined,
                });
              }
            }
          }

          // Check auth
          const hasAuth = cls.getDecorator("ApiBearerAuth") ?? method.getDecorator("ApiBearerAuth");

          endpoints.push({
            method: httpMethod.toUpperCase(),
            path: fullPath,
            summary: summary ?? undefined,
            description: description ?? undefined,
            tags: apiTags ? [apiTags] : [],
            parameters: params,
            requestBody,
            responses,
            auth: hasAuth ? "Bearer token" : undefined,
          });
        }
      }
    }

    project.removeSourceFile(sourceFile);
  }

  return endpoints;
}

function extractDecoratorStringArg(dec: ReturnType<typeof import("ts-morph").ClassDeclaration.prototype.getDecorator> | undefined): string | null {
  if (!dec) return null;
  const args = dec.getArguments();
  if (args.length === 0) return null;
  const first = args[0];
  if (first.getKind() === SyntaxKind.StringLiteral) {
    return first.getText().replace(/['"]/g, "");
  }
  return null;
}

function extractDecoratorObjectProp(dec: ReturnType<typeof import("ts-morph").ClassDeclaration.prototype.getDecorator> | undefined, prop: string): string | null {
  if (!dec) return null;
  const args = dec.getArguments();
  if (args.length === 0) return null;
  const text = args[0].getText();
  const regex = new RegExp(`${prop}\\s*:\\s*['"]([^'"]+)['"]`);
  const match = text.match(regex);
  return match ? match[1] : null;
}

function findFiles(dir: string, suffix: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...findFiles(fullPath, suffix));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      results.push(fullPath);
    }
  }
  return results;
}
