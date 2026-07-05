export interface ProviderConfig { id: string; name: string; baseUrl: string; apiKey: string; models: ProviderModel[] }
export interface ProviderModel { id: string; modelName: string; displayName?: string; maxTokens?: number; isActive: boolean }
