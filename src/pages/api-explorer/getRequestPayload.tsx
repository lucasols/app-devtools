import { ApiRequest } from '@src/stores/callsStore';

export function getRequestPayload(request: ApiRequest) {
  const payload = request.alias || request.payload || request.searchParams;

  if (!payload || Object.keys(payload).length === 0) {
    return '';
  }

  if (typeof payload === 'string' || typeof payload === 'number') {
    return String(payload);
  }

  return JSON.stringify(payload);
}
