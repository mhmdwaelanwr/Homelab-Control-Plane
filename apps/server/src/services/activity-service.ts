import type { ActivityItem } from '../types/system.js';

class ActivityService {
  private items: ActivityItem[] = [];

  constructor() {
    this.push({
      source: 'system',
      level: 'info',
      message: 'Control plane initialized and awaiting operator connections.',
    });
  }

  push(input: Omit<ActivityItem, 'id' | 'timestamp'>) {
    this.items.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: Date.now(),
      ...input,
    });

    this.items = this.items.slice(0, 40);
  }

  recent(limit = 8) {
    return this.items.slice(0, limit);
  }
}

export const activityService = new ActivityService();
