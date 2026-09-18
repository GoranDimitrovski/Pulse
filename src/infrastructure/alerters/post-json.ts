const DELIVERY_TIMEOUT_MS = 5000;

/**
 * Every alerter delivers the same way: POST JSON, bounded by a timeout, and treat a non-2xx
 * as a failure. Without the timeout a hung webhook leaves the promise pending forever, and
 * `Promise.all` over a tenant's channels never settles; without the status check a 500 from
 * Slack is logged as a successful delivery.
 */
export async function postJson(url: string, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Alert delivery failed with status ${String(response.status)}`);
  }
}
