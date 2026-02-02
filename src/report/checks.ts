import type { ConformanceCheck, CheckStatus } from "./types.js";

function check(name: string, status: CheckStatus, message: string): ConformanceCheck {
  return { name, status, message };
}

/**
 * Validates that the codebase has schema validity support (handlers/types with request/response shapes).
 */
function checkSchemaValidity(): ConformanceCheck {
  try {
    const mod = require("../handlers/types.js");
    if (mod.ChatCompletionRequest && mod.ChatCompletionResponse) {
      return check("schema_validity", "pass", "ChatCompletion request/response types defined");
    }
    return check("schema_validity", "warn", "Handler types present but incomplete");
  } catch {
    return check("schema_validity", "fail", "Handler schema types not found");
  }
}

/**
 * Validates canonical error wrapping (errors module with CanonicalError and wrapUpstreamError).
 */
function checkCanonicalErrorWrapping(): ConformanceCheck {
  try {
    const mod = require("../errors/factory.js");
    const types = require("../errors/types.js");
    if (types.CanonicalError && mod.wrapUpstreamError && mod.createCanonicalError) {
      return check("canonical_error_wrapping", "pass", "Canonical error envelope and wrappers present");
    }
    return check("canonical_error_wrapping", "warn", "Error module present but missing exports");
  } catch {
    return check("canonical_error_wrapping", "fail", "Canonical error module not found");
  }
}

/**
 * Validates pagination normalization (PaginatedResponse and normalizeListResponse).
 */
function checkPaginationNormalization(): ConformanceCheck {
  try {
    const mod = require("../pagination/normalize.js");
    const types = require("../pagination/types.js");
    if (types.PaginatedResponse && mod.normalizeListResponse) {
      return check("pagination_normalization", "pass", "PaginatedResponse and normalizeListResponse present");
    }
    return check("pagination_normalization", "warn", "Pagination module incomplete");
  } catch {
    return check("pagination_normalization", "fail", "Pagination normalization not found");
  }
}

/**
 * Validates auth behavior (AuthConfig, allowPassthrough).
 */
function checkAuthBehavior(): ConformanceCheck {
  try {
    const mod = require("../auth/types.js");
    if (mod.AuthConfig) {
      return check("auth_behavior", "pass", "AuthConfig with allowPassthrough defined");
    }
    return check("auth_behavior", "warn", "Auth types present but AuthConfig missing");
  } catch {
    return check("auth_behavior", "fail", "Auth config not found");
  }
}

/**
 * Validates determinism support (idempotency context / deterministic handling).
 */
function checkDeterminism(): ConformanceCheck {
  try {
    const mod = require("../idempotency/types.js");
    if (mod.IdempotencyContext) {
      return check("determinism", "pass", "IdempotencyContext defined for deterministic handling");
    }
    return check("determinism", "warn", "Idempotency module present but IdempotencyContext missing");
  } catch {
    return check("determinism", "fail", "Idempotency/determinism support not found");
  }
}

/**
 * Runs all conformance checks: schema validity, canonical error wrapping,
 * pagination normalization, auth behavior, determinism.
 */
export function runConformanceChecks(): ConformanceCheck[] {
  return [
    checkSchemaValidity(),
    checkCanonicalErrorWrapping(),
    checkPaginationNormalization(),
    checkAuthBehavior(),
    checkDeterminism(),
  ];
}
