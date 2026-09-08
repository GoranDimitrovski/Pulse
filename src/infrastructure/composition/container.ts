import { RegisterTenantUseCase } from '../../application/use-cases/auth/register-tenant.use-case.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { RefreshSessionUseCase } from '../../application/use-cases/auth/refresh-session.use-case.js';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case.js';
import { RequestPasswordResetUseCase } from '../../application/use-cases/auth/request-password-reset.use-case.js';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case.js';
import { CreateTargetUseCase } from '../../application/use-cases/targets/create-target.use-case.js';
import { ListTargetsUseCase } from '../../application/use-cases/targets/list-targets.use-case.js';
import { GetTargetUseCase } from '../../application/use-cases/targets/get-target.use-case.js';
import { UpdateTargetUseCase } from '../../application/use-cases/targets/update-target.use-case.js';
import { DeleteTargetUseCase } from '../../application/use-cases/targets/delete-target.use-case.js';
import { RecordCheckResultUseCase } from '../../application/use-cases/checks/record-check-result.use-case.js';
import { GetTargetHistoryUseCase } from '../../application/use-cases/checks/get-target-history.use-case.js';
import { GetDashboardSnapshotUseCase } from '../../application/use-cases/checks/get-dashboard-snapshot.use-case.js';
import { CreateAlertChannelUseCase } from '../../application/use-cases/alerts/create-alert-channel.use-case.js';
import { ListAlertChannelsUseCase } from '../../application/use-cases/alerts/list-alert-channels.use-case.js';
import { DeleteAlertChannelUseCase } from '../../application/use-cases/alerts/delete-alert-channel.use-case.js';
import { DispatchStatusChangeAlertsUseCase } from '../../application/use-cases/alerts/dispatch-status-change-alerts.use-case.js';
import { CreateApiKeyUseCase } from '../../application/use-cases/api-keys/create-api-key.use-case.js';
import { ListApiKeysUseCase } from '../../application/use-cases/api-keys/list-api-keys.use-case.js';
import { RevokeApiKeyUseCase } from '../../application/use-cases/api-keys/revoke-api-key.use-case.js';
import { AuthenticateApiKeyUseCase } from '../../application/use-cases/api-keys/authenticate-api-key.use-case.js';

import type { Env } from '../../shared/config/env.js';
import { parseDurationMs } from '../../shared/duration.js';
import type { Database } from '../database/client.js';
import { DrizzleTenantRepository } from '../database/repositories/drizzle-tenant.repository.js';
import { DrizzleUserRepository } from '../database/repositories/drizzle-user.repository.js';
import { DrizzleRefreshTokenRepository } from '../database/repositories/drizzle-refresh-token.repository.js';
import { DrizzlePasswordResetTokenRepository } from '../database/repositories/drizzle-password-reset-token.repository.js';
import { DrizzleTargetRepository } from '../database/repositories/drizzle-target.repository.js';
import { DrizzleCheckResultRepository } from '../database/repositories/drizzle-check-result.repository.js';
import { DrizzleAlertChannelRepository } from '../database/repositories/drizzle-alert-channel.repository.js';
import { DrizzleApiKeyRepository } from '../database/repositories/drizzle-api-key.repository.js';

import { Argon2PasswordHasher } from '../security/argon2-password-hasher.js';
import { JwtTokenService } from '../security/jwt-token-service.js';
import { ConsoleMailer } from '../notifications/console-mailer.js';
import { SystemClock } from '../system/system-clock.js';

import { HttpChecker } from '../checkers/http.checker.js';
import { TcpChecker } from '../checkers/tcp.checker.js';
import { DnsChecker } from '../checkers/dns.checker.js';
import { PingChecker } from '../checkers/ping.checker.js';
import { HealthCheckerFactory } from '../checkers/checker.factory.js';

import { WebhookAlerter } from '../alerters/webhook.alerter.js';
import { DiscordAlerter } from '../alerters/discord.alerter.js';
import { SlackAlerter } from '../alerters/slack.alerter.js';
import { AlerterFactory } from '../alerters/alerter.factory.js';
import { AlertDispatcher } from '../alerters/alert-dispatcher.js';

import { EventBus } from '../events/event-bus.js';
import { CircuitBreakerRegistry } from '../concurrency/circuit-breaker-registry.js';
import { WorkerPool } from '../concurrency/worker-pool.js';
import { CheckScheduler } from '../concurrency/check-scheduler.js';
import { ConnectionManager } from '../websocket/connection-manager.js';
import { DashboardGateway } from '../websocket/dashboard-gateway.js';
import { Metrics } from '../metrics/metrics.js';
import type { Logger } from '../logging/logger.js';

export function createContainer(env: Env, db: Database, logger: Logger) {
  const clock = new SystemClock();
  const passwordHasher = new Argon2PasswordHasher();
  const tokenService = new JwtTokenService(env.JWT_ACCESS_SECRET, env.JWT_ACCESS_TTL);
  const mailer = new ConsoleMailer(logger);
  const refreshTtlMs = parseDurationMs(env.JWT_REFRESH_TTL);

  const tenants = new DrizzleTenantRepository(db);
  const users = new DrizzleUserRepository(db);
  const refreshTokens = new DrizzleRefreshTokenRepository(db);
  const passwordResetTokens = new DrizzlePasswordResetTokenRepository(db);
  const targets = new DrizzleTargetRepository(db);
  const checkResults = new DrizzleCheckResultRepository(db);
  const alertChannels = new DrizzleAlertChannelRepository(db);
  const apiKeys = new DrizzleApiKeyRepository(db);

  const eventBus = new EventBus();
  const metrics = new Metrics();
  const connectionManager = new ConnectionManager();
  const dashboardGateway = new DashboardGateway(eventBus, connectionManager);

  const checkerFactory = new HealthCheckerFactory([
    new HttpChecker(),
    new TcpChecker(),
    new DnsChecker(),
    new PingChecker(),
  ]);
  const alerterFactory = new AlerterFactory([
    new WebhookAlerter(),
    new DiscordAlerter(),
    new SlackAlerter(),
  ]);

  const circuitBreakers = new CircuitBreakerRegistry({
    failureThreshold: env.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
    resetTimeoutMs: env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
  });
  const workerPool = new WorkerPool(env.CHECK_CONCURRENCY);

  const useCases = {
    registerTenant: new RegisterTenantUseCase(tenants, users, passwordHasher),
    login: new LoginUseCase(users, refreshTokens, passwordHasher, tokenService, clock, refreshTtlMs),
    refreshSession: new RefreshSessionUseCase(users, refreshTokens, tokenService, clock, refreshTtlMs),
    logout: new LogoutUseCase(refreshTokens, tokenService),
    requestPasswordReset: new RequestPasswordResetUseCase(users, passwordResetTokens, tokenService, mailer, clock),
    resetPassword: new ResetPasswordUseCase(users, passwordResetTokens, refreshTokens, tokenService, passwordHasher, clock),

    createTarget: new CreateTargetUseCase(targets),
    listTargets: new ListTargetsUseCase(targets),
    getTarget: new GetTargetUseCase(targets),
    updateTarget: new UpdateTargetUseCase(targets),
    deleteTarget: new DeleteTargetUseCase(targets),

    recordCheckResult: new RecordCheckResultUseCase(checkResults, eventBus),
    getTargetHistory: new GetTargetHistoryUseCase(targets, checkResults),
    getDashboardSnapshot: new GetDashboardSnapshotUseCase(targets, checkResults),

    createAlertChannel: new CreateAlertChannelUseCase(alertChannels),
    listAlertChannels: new ListAlertChannelsUseCase(alertChannels),
    deleteAlertChannel: new DeleteAlertChannelUseCase(alertChannels),
    dispatchStatusChangeAlerts: new DispatchStatusChangeAlertsUseCase(alertChannels, alerterFactory, logger),

    createApiKey: new CreateApiKeyUseCase(apiKeys, tokenService),
    listApiKeys: new ListApiKeysUseCase(apiKeys),
    revokeApiKey: new RevokeApiKeyUseCase(apiKeys),
    authenticateApiKey: new AuthenticateApiKeyUseCase(apiKeys, tokenService),
  };

  const checkScheduler = new CheckScheduler(
    targets,
    checkerFactory,
    useCases.recordCheckResult,
    circuitBreakers,
    workerPool,
    logger,
    metrics,
  );

  const alertDispatcher = new AlertDispatcher(eventBus, useCases.dispatchStatusChangeAlerts, logger);

  return {
    env,
    db,
    logger,
    tokenService,
    useCases,
    eventBus,
    metrics,
    connectionManager,
    dashboardGateway,
    checkScheduler,
    alertDispatcher,
  };
}

export type Container = ReturnType<typeof createContainer>;
