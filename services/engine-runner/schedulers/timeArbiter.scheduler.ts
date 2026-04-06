// services/engine-runner/schedulers/timeArbiter.scheduler.ts

import { TimeArbiterEngine } from "../consumers/timeArbiterEngine";
import { logger } from "../../../shared/logging/logger";

export class TimeArbiterScheduler {
  private interval?: NodeJS.Timeout;
  private running = false;

  private metrics = {
    scanned: 0,
    expiredEmitted: 0,
    skippedClosed: 0,
    skippedAlreadyExpired: 0
  };

  constructor(
    private engine: TimeArbiterEngine,
    private intervalMs = 600000
  ) {}

  start() {
    if (this.running) return;
    this.running = true;

    this.interval = setInterval(async () => {
      try {
        const stats = await this.engine.tickExpireDueTimers();
        this.metrics.scanned += stats.scanned;
        this.metrics.expiredEmitted += stats.emitted;
        this.metrics.skippedClosed += stats.skippedClosed;
        this.metrics.skippedAlreadyExpired += stats.skippedAlreadyExpired;

        logger.info(
          {
            engine: "TimeArbiter",
            ...stats
          },
          "TimeArbiter tick completed"
        );

      } catch (err) {
        logger.error({ err }, "TimeArbiter tick failed");
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.running = false;
  }

  getMetrics() {
    return this.metrics;
  }
}