import type { WebSocket } from 'ws';

/** Tracks live dashboard sockets grouped by tenant, so broadcasts never cross tenants. */
export class ConnectionManager {
  private readonly connectionsByTenant = new Map<string, Set<WebSocket>>();

  add(tenantId: string, socket: WebSocket): void {
    let sockets = this.connectionsByTenant.get(tenantId);
    if (!sockets) {
      sockets = new Set();
      this.connectionsByTenant.set(tenantId, sockets);
    }
    sockets.add(socket);
  }

  remove(tenantId: string, socket: WebSocket): void {
    const sockets = this.connectionsByTenant.get(tenantId);
    sockets?.delete(socket);
    if (sockets && sockets.size === 0) {
      this.connectionsByTenant.delete(tenantId);
    }
  }

  broadcast(tenantId: string, payload: unknown): void {
    const sockets = this.connectionsByTenant.get(tenantId);
    if (!sockets || sockets.size === 0) return;

    const message = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) {
        socket.send(message);
      }
    }
  }

  closeAll(): void {
    for (const sockets of this.connectionsByTenant.values()) {
      for (const socket of sockets) {
        socket.close(1001, 'Server shutting down');
      }
    }
    this.connectionsByTenant.clear();
  }
}
