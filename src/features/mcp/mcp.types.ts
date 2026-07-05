/**
 * mcp.types.ts  MCP / Integrations  Type Definitions
 * Phase 6: First-class MCP entry in Codex-style workbench
 */

export interface MCPServiceItem {
  id: string
  name: string
  type: 'local' | 'remote' | 'oauth'
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error' | 'authorizing'
  description?: string
  lastCheckedAt?: string
  errorMessage?: string
}

export interface MCPServiceState {
  services: MCPServiceItem[]
  loading: boolean
  error: string | null
}

export function createDefaultMCPServices(): MCPServiceItem[] {
  return [
    {
      id: 'filesystem',
      name: 'Filesystem',
      type: 'local',
      enabled: true,
      status: 'connected',
      description: 'Local file system access for reading/writing project files.',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'supabase',
      name: 'Supabase',
      type: 'remote',
      enabled: false,
      status: 'disconnected',
      description: 'Database and auth integration via Supabase MCP.',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'oauth',
      enabled: false,
      status: 'disconnected',
      description: 'Payment processing integration.',
    },
  ]
}
