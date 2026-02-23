# Exchange Rate & Liquidity Provider Management

## Overview
Management and monitoring of exchange rate feeds and liquidity provider integrations used during settlement. Finance admins can view rates, monitor provider health, and intervene when rate feeds are stale or providers are failing.

## Entities

### ExchangeRateSnapshot
Tracks all exchange rate data points including manual overrides.

**Fields:**
- `tokenSymbol`: Token identifier (USDC, ETH, MATIC)
- `fiatCurrency`: Fiat currency code (USD, NGN, GBP)
- `rate`: Exchange rate (decimal 20,8)
- `provider`: Rate source (coingecko, chainlink, manual)
- `isManualOverride`: Whether this is a manual override
- `overrideSetById`: Admin user ID who set the override
- `overrideExpiresAt`: When the override expires

### LiquidityProvider
Manages liquidity provider configurations and health status.

**Fields:**
- `name`: Unique provider identifier
- `displayName`: Human-readable name
- `supportedCurrencies`: Array of supported fiat currencies
- `status`: ACTIVE | DEGRADED | DOWN | DISABLED
- `isEnabled`: Whether provider is enabled
- `priority`: Failover priority (lower = higher priority)
- `feePercentage`: Provider fee percentage
- `rateLimits`: Rate limit configuration
- `lastHealthCheckAt`: Last health check timestamp
- `lastHealthCheckLatencyMs`: Last health check latency
- `successRate30d`: 30-day success rate
- `dailyVolumeLimit`: Daily volume limit
- `todayUsedVolume`: Volume used today

## API Endpoints

### GET /api/v1/rates/current
**Permission:** `analytics:read`

Returns current exchange rates for all token/fiat pairs with staleness indicators.

**Response:**
```json
{
  "rates": [
    {
      "pair": "USDC/USD",
      "rate": "1.0000",
      "provider": "chainlink",
      "fetchedAt": "2026-02-19T09:59:30Z",
      "ageSeconds": 30,
      "isStale": false,
      "stalenessThresholdSeconds": 300,
      "isManualOverride": false
    }
  ]
}
```

### GET /api/v1/rates/history
**Permission:** `analytics:read`

Query historical rate data for charting.

**Query Parameters:**
- `pair`: Token/fiat pair (e.g., ETH/USD)
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `granularity`: minute | hour | day

### POST /api/v1/rates/override
**Permission:** `config:write` (FINANCE_ADMIN + SUPER_ADMIN only)

Set manual rate override with safety guards.

**Request:**
```json
{
  "tokenSymbol": "ETH",
  "fiatCurrency": "USD",
  "rate": "3000.00",
  "durationMinutes": 60,
  "reason": "Market volatility detected, setting stable rate for next hour"
}
```

**Validations:**
- Rate must be within ±20% of current market rate
- Duration max 24 hours (1440 minutes)
- Reason must be at least 20 characters

**Behavior:**
- Creates ExchangeRateSnapshot with `isManualOverride = true`
- Schedules BullMQ job to clear override at expiration
- Logs audit event: `EXCHANGE_RATE_OVERRIDE_SET`

### DELETE /api/v1/rates/override/:tokenSymbol/:fiatCurrency
**Permission:** `config:write`

Clear active rate override immediately.

### GET /api/v1/liquidity-providers
**Permission:** `config:read`

List all liquidity providers with real-time health status, ordered by priority.

### PATCH /api/v1/liquidity-providers/:id
**Permission:** `config:write`

Update provider configuration.

**Request:**
```json
{
  "isEnabled": false,
  "priority": 2,
  "feePercentage": "0.0200",
  "dailyVolumeLimit": "1000000.00"
}
```

**Validations:**
- Disabling a provider with in-progress settlements returns 409 with settlement IDs
- Priority changes take effect immediately for new settlements

### POST /api/v1/liquidity-providers/:id/health-check
**Permission:** `config:read`

Trigger manual health check for a provider.

**Response:**
```json
{
  "id": "uuid",
  "name": "yellowcard",
  "status": "ACTIVE",
  "lastHealthCheckAt": "2026-02-19T10:00:00Z",
  "lastHealthCheckLatencyMs": 245
}
```

### GET /api/v1/liquidity-providers/:id/performance
**Permission:** `config:read`

Get provider performance metrics.

**Response:**
```json
{
  "successRate": "99.50",
  "averageLatency": 245,
  "volumeHandled": "50000.00",
  "status": "ACTIVE"
}
```

## Background Jobs

### Rate Snapshot Capture (Every Minute)
- Captures current exchange rates from providers
- Skips pairs with active manual overrides
- Stores snapshots for historical analysis

### Provider Health Checks (Every 5 Minutes)
- Tests connectivity to all enabled providers
- Updates status (ACTIVE/DEGRADED/DOWN)
- Records latency metrics
- Logs failures for alerting

### Rate Override Expiration (Delayed Job)
- Automatically clears expired manual overrides
- Scheduled when override is set
- Ensures overrides don't persist beyond intended duration

## Acceptance Criteria

✅ Manual rate override blocked if rate deviates >20% from market  
✅ Override automatically expires via BullMQ delayed job  
✅ Rate staleness computed and flagged (>5 minutes)  
✅ Disabling provider with in-flight settlements returns 409  
✅ Provider health checks run every 5 minutes automatically  
✅ Priority reordering takes effect immediately for new settlements  

## Database Migration

Run migration:
```bash
npm run migration:run
```

Seed liquidity providers:
```bash
npm run seed
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Manual testing
curl -X GET http://localhost:3000/api/v1/rates/current \
  -H "Authorization: Bearer <admin-token>"
```

## Security

- All endpoints require admin authentication
- Rate overrides require `config:write` permission (FINANCE_ADMIN or SUPER_ADMIN)
- All actions are audit logged
- Rate deviation safety guard prevents fat-finger errors

## Monitoring

- Rate staleness alerts when >5 minutes old
- Provider health status tracked in real-time
- Audit logs for all configuration changes
- BullMQ dashboard for job monitoring at `/admin/queues`
