const MAX_ENTRIES = 200;

export interface LoginLogEntry {
  timestamp: string;
  usuario: string;
  status: 'success' | 'failed';
  reason: string;
  id_usuario?: number;
  ip?: string;
}

const entries: LoginLogEntry[] = [];

export function logLogin(entry: LoginLogEntry): void {
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.splice(MAX_ENTRIES);
  }
}

export function getLoginLog(): LoginLogEntry[] {
  return [...entries];
}
