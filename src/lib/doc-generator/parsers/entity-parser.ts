import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import fs from "fs";

export interface EntityInfo {
  name: string;
  tableName: string;
  schema?: string;
  columns: ColumnInfo[];
  relations: RelationInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  unique: boolean;
  default?: string;
  description?: string;
}

export interface RelationInfo {
  type: "ManyToOne" | "OneToMany" | "ManyToMany" | "OneToOne";
  target: string;
  propertyName: string;
  joinColumn?: boolean;
}

export interface ServiceEntities {
  serviceName: string;
  schema: string;
  entities: EntityInfo[];
}

export interface MongooseSchemaInfo {
  name: string;
  collectionName?: string;
  fields: { name: string; type: string; required: boolean; default?: string }[];
}

export function parseAllEntities(repoPath: string): ServiceEntities[] {
  const servicesDir = path.join(repoPath, "services");
  if (!fs.existsSync(servicesDir)) return [];

  const results: ServiceEntities[] = [];
  const serviceDirs = fs.readdirSync(servicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith("-service"));

  for (const serviceDir of serviceDirs) {
    const entitiesDir = path.join(servicesDir, serviceDir.name, "src", "entities");
    if (!fs.existsSync(entitiesDir)) continue;

    const entities = parseEntitiesFromDir(entitiesDir);
    if (entities.length > 0) {
      const schema = inferSchema(serviceDir.name);
      results.push({
        serviceName: serviceDir.name,
        schema,
        entities,
      });
    }
  }

  return results;
}

export function parseMongooseSchemas(repoPath: string): MongooseSchemaInfo[] {
  const schemasDir = path.join(repoPath, "services", "product-service", "src", "schemas");
  if (!fs.existsSync(schemasDir)) {
    // Try alternative locations
    const altDir = path.join(repoPath, "services", "product-service", "src");
    return parseMongooseSchemasFromDir(altDir);
  }
  return parseMongooseSchemasFromDir(schemasDir);
}

function parseEntitiesFromDir(dir: string): EntityInfo[] {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const entities: EntityInfo[] = [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".entity.ts"));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const sourceFile = project.addSourceFileAtPath(filePath);
    const classes = sourceFile.getClasses();

    for (const cls of classes) {
      const entityDec = cls.getDecorator("Entity");
      if (!entityDec) continue;

      const entityArg = entityDec.getArguments()[0]?.getText() ?? "";
      const tableNameMatch = entityArg.match(/name\s*:\s*['"]([^'"]+)['"]/);
      const schemaMatch = entityArg.match(/schema\s*:\s*['"]([^'"]+)['"]/);

      const tableName = tableNameMatch
        ? tableNameMatch[1]
        : (entityArg.replace(/['"]/g, "") || cls.getName()?.toLowerCase()) ?? "unknown";

      const columns: ColumnInfo[] = [];
      const relations: RelationInfo[] = [];

      for (const prop of cls.getProperties()) {
        // Check for Column decorator
        const colDec = prop.getDecorator("Column");
        const primaryColDec = prop.getDecorator("PrimaryGeneratedColumn") ?? prop.getDecorator("PrimaryColumn");
        const createDateDec = prop.getDecorator("CreateDateColumn");
        const updateDateDec = prop.getDecorator("UpdateDateColumn");

        if (colDec || primaryColDec || createDateDec || updateDateDec) {
          const colArgs = (colDec ?? primaryColDec)?.getArguments()[0]?.getText() ?? "";
          const isNullable = colArgs.includes("nullable: true") || colArgs.includes("nullable:true");
          const isUnique = colArgs.includes("unique: true");
          const defaultMatch = colArgs.match(/default\s*:\s*['"]?([^'",}]+)['"]?/);
          const typeMatch = colArgs.match(/type\s*:\s*['"]([^'"]+)['"]/);

          columns.push({
            name: prop.getName(),
            type: typeMatch ? typeMatch[1] : prop.getType().getText() ?? "string",
            nullable: isNullable,
            primary: !!primaryColDec,
            unique: isUnique || !!primaryColDec,
            default: defaultMatch ? defaultMatch[1].trim() : undefined,
          });
        }

        // Check for relation decorators
        for (const relType of ["ManyToOne", "OneToMany", "ManyToMany", "OneToOne"] as const) {
          const relDec = prop.getDecorator(relType);
          if (relDec) {
            const args = relDec.getArguments();
            const targetText = args[0]?.getText() ?? "";
            const targetMatch = targetText.match(/=>\s*(\w+)/);

            relations.push({
              type: relType,
              target: targetMatch ? targetMatch[1] : "Unknown",
              propertyName: prop.getName(),
              joinColumn: !!prop.getDecorator("JoinColumn"),
            });
          }
        }
      }

      entities.push({
        name: cls.getName() ?? "Unknown",
        tableName,
        schema: schemaMatch ? schemaMatch[1] : undefined,
        columns,
        relations,
      });
    }

    project.removeSourceFile(sourceFile);
  }

  return entities;
}

function parseMongooseSchemasFromDir(dir: string): MongooseSchemaInfo[] {
  if (!fs.existsSync(dir)) return [];

  const schemas: MongooseSchemaInfo[] = [];
  const files = findSchemaFiles(dir);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

    // Match Schema definition
    const schemaRegex = /new\s+Schema\s*[<(][\s\S]*?\{([\s\S]*?)\}\s*[,)]/g;
    const nameMatch = content.match(/export\s+(?:class|const)\s+(\w+)/);
    const collectionMatch = content.match(/collection\s*:\s*['"]([^'"]+)['"]/);

    let match;
    while ((match = schemaRegex.exec(content)) !== null) {
      const schemaBody = match[1];
      const fields = parseMongooseFields(schemaBody);

      schemas.push({
        name: nameMatch ? nameMatch[1].replace(/Schema$/, "") : path.basename(file, ".ts"),
        collectionName: collectionMatch ? collectionMatch[1] : undefined,
        fields,
      });
    }
  }

  return schemas;
}

function parseMongooseFields(body: string): MongooseSchemaInfo["fields"] {
  const fields: MongooseSchemaInfo["fields"] = [];
  // Simple regex parsing for field: { type: X, required: Y }
  const fieldRegex = /(\w+)\s*:\s*\{([^}]+)\}/g;
  let match;

  while ((match = fieldRegex.exec(body)) !== null) {
    const name = match[1];
    const props = match[2];
    const typeMatch = props.match(/type\s*:\s*(\w+)/);
    const requiredMatch = props.match(/required\s*:\s*(true|false)/);
    const defaultMatch = props.match(/default\s*:\s*([^,}]+)/);

    fields.push({
      name,
      type: typeMatch ? typeMatch[1] : "Mixed",
      required: requiredMatch ? requiredMatch[1] === "true" : false,
      default: defaultMatch ? defaultMatch[1].trim() : undefined,
    });
  }

  return fields;
}

function findSchemaFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...findSchemaFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".schema.ts") || entry.name.includes("schema"))) {
      results.push(fullPath);
    }
  }
  return results;
}

function inferSchema(serviceName: string): string {
  const map: Record<string, string> = {
    "identity-service": "identity",
    "order-service": "orders",
    "provisioning-service": "provision",
    "billing-integration": "billing",
    "notification-service": "notif",
    "support-service": "support",
    "product-service": "products",
  };
  return map[serviceName] ?? serviceName.replace("-service", "");
}
