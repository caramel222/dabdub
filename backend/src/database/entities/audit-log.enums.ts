export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  SANDBOX_RESET = 'sandbox_reset',
  EXCHANGE_RATE_OVERRIDE_SET = 'exchange_rate_override_set',
}

export enum ActorType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
  API_KEY = 'api_key',
  SERVICE_ACCOUNT = 'service_account',
}

export enum DataClassification {
  SENSITIVE = 'sensitive',
  NORMAL = 'normal',
  PUBLIC = 'public',
}
