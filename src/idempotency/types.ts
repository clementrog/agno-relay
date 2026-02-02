export interface IdempotencyContext {
  key: string | null;
  isReadOnly: boolean;
}
