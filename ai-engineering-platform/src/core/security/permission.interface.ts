export interface FileSystemPermission {
  readonly read: boolean;
  readonly write: boolean;
  readonly allowedRoots: readonly string[];
}

export interface CommandPermission {
  readonly execute: boolean;
  readonly allowList: readonly string[];
}

export interface GitPermission {
  readonly read: boolean;
  readonly write: boolean;
}

export interface DatabasePermission {
  readonly read: boolean;
  readonly write: boolean;
}

export interface NetworkPermission {
  readonly enabled: boolean;
}

export interface ToolPermission {
  readonly fileSystem: FileSystemPermission;
  readonly commands: CommandPermission;
  readonly git: GitPermission;
  readonly database: DatabasePermission;
  readonly network: NetworkPermission;
}

export const NO_PERMISSION: ToolPermission = {
  fileSystem: {
    read: false,
    write: false,
    allowedRoots: [],
  },
  commands: {
    execute: false,
    allowList: [],
  },
  git: {
    read: false,
    write: false,
  },
  database: {
    read: false,
    write: false,
  },
  network: {
    enabled: false,
  },
};
