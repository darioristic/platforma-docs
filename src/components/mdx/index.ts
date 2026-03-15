import type { MDXComponents } from "mdx/types";
import Callout from "./Callout";
import ApiEndpoint from "./ApiEndpoint";
import { Tabs, Tab } from "./Tabs";
import { Steps, Step } from "./Steps";
import { ParamTable, Param } from "./ParamTable";
import ResponseExample from "./ResponseExample";
import { Card, CardGrid } from "./Card";
import Badge from "./Badge";
import Diagram from "./Diagram";
import CodeBlock from "./CodeBlock";

export const mdxComponents: MDXComponents = {
  // Custom components
  Callout,
  ApiEndpoint,
  Tabs,
  Tab,
  Steps,
  Step,
  ParamTable,
  Param,
  ResponseExample,
  Card,
  CardGrid,
  Badge,
  Diagram,

  // Override default elements
  pre: CodeBlock,
};
