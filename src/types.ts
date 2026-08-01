export interface ToolInput {
  name: string;
  type: 'text' | 'select' | 'password';
  options?: string[];
  default?: string;
  placeholder?: string;
}

export interface ToolEntry {
  id: string;
  name: string;
  category: string;
  command: string;
  description: string;
  inputs?: ToolInput[];
}

export interface Manifest {
  schema_version: number;
  categories: { id: string; name: string; icon: string }[];
  tools: ToolEntry[];
}

export interface AssetInfo {
  path: string;
  name: string;
  ext: string;
  sizeBytes: number;
  category: string;
}

export interface PubspecDep {
  name: string;
  version: string;
  isDev: boolean;
}

export type PostFn = (msg: unknown) => void;
