export type CapabilityState = 'available' | 'unavailable';

export class CapabilityRegistry {
  private readonly states = new Map<string, CapabilityState>();

  public get(feature: string): CapabilityState | undefined {
    return this.states.get(feature);
  }

  public isUnavailable(feature: string): boolean {
    return this.states.get(feature) === 'unavailable';
  }

  public markAvailable(feature: string): void {
    this.states.set(feature, 'available');
  }

  public markUnavailable(feature: string): void {
    this.states.set(feature, 'unavailable');
  }

  public snapshot(): Record<string, CapabilityState> {
    return Object.fromEntries(this.states.entries());
  }
}
