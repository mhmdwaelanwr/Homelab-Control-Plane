import type {
  TerminalExecuteRequest,
  TerminalExecutionResult,
  TerminalPresetsResponse,
} from '@/types/api';

import { apiRequest } from './api';

export function executeTerminalCommand(payload: TerminalExecuteRequest) {
  return apiRequest<TerminalExecutionResult>('/terminal/execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchTerminalPresets() {
  return apiRequest<TerminalPresetsResponse>('/terminal/presets');
}
