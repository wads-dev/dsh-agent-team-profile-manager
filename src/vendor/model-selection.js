// Adapted from ivbrajkovic/deepseek-harness commit 30da5c7 (MIT). See NOTICE.
import { ReasoningEffortId } from '@deepseek-ai/dsh-llm';

/** Whether a call explicitly selects a model route or reasoning effort. */
export function hasDelegationModelRequest(request) {
  return request.provider !== undefined
    || request.model !== undefined
    || request.reasoning_effort !== undefined;
}

function assertNonEmpty(value, field) {
  if (value !== undefined && value.length === 0) {
    throw new Error(`child LLM \`${field}\` must be non-empty`);
  }
}

/** Merge explicit route fields over configured child defaults. */
export function requestedAgentOptions(parentOptions, configured, request) {
  if (!hasDelegationModelRequest(request)) return configured;
  assertNonEmpty(request.provider, 'provider');
  assertNonEmpty(request.model, 'model');
  assertNonEmpty(request.reasoning_effort, 'reasoning_effort');
  if ((request.provider === undefined) !== (request.model === undefined)) {
    throw new Error('child LLM `provider` and `model` must be supplied together');
  }

  const baselineProvider = configured?.provider ?? parentOptions.provider;
  const baselineModel = configured?.model ?? parentOptions.model;
  const routeChanged = request.provider !== undefined
    && (request.provider !== baselineProvider || request.model !== baselineModel);
  const { reasoningEffort: _configuredReasoningEffort, ...configuredWithoutReasoning } = configured ?? {};
  return {
    ...(routeChanged && request.reasoning_effort === undefined ? configuredWithoutReasoning : configured),
    ...(request.provider === undefined ? {} : { provider: request.provider, model: request.model }),
    ...(request.reasoning_effort === undefined ? {} : { reasoningEffort: ReasoningEffortId(request.reasoning_effort) }),
  };
}
