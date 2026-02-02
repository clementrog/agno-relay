export type { CanonicalError, CanonicalErrorContext, ErrorClass } from "./types.js";
export {
  createCanonicalError,
  httpStatusToErrorClass,
  wrapUpstreamError,
  wrapNetworkError,
  wrapTimeoutError,
  setRetryable,
} from "./factory.js";
export type { UpstreamResponse } from "./factory.js";
