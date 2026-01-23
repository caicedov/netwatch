/**
 * Energy Value Object
 *
 * Represents the action resource pool.
 * Bounded by max capacity, regenerates over time.
 */
export class Energy {
  private readonly current: number;
  private readonly max: number;

  private constructor(current: number, max: number) {
    if (current < 0) {
      throw new Error('Energy cannot be negative');
    }
    if (max <= 0) {
      throw new Error('Max energy must be positive');
    }
    if (current > max) {
      throw new Error('Energy cannot exceed maximum');
    }
    this.current = current;
    this.max = max;
  }

  static create(current: number, max: number): Energy {
    return new Energy(current, max);
  }

  static full(max: number): Energy {
    return new Energy(max, max);
  }

  getCurrent(): number {
    return this.current;
  }

  getMax(): number {
    return this.max;
  }

  isFull(): boolean {
    return this.current === this.max;
  }

  isEmpty(): boolean {
    return this.current === 0;
  }

  canConsume(amount: number): boolean {
    return amount > 0 && amount <= this.current;
  }

  consume(amount: number): Energy {
    if (amount < 0) {
      throw new Error('Cannot consume negative energy');
    }
    if (amount > this.current) {
      throw new Error('Insufficient energy');
    }
    return new Energy(this.current - amount, this.max);
  }

  regenerate(amount: number): Energy {
    if (amount < 0) {
      throw new Error('Cannot regenerate negative energy');
    }
    const newCurrent = Math.min(this.current + amount, this.max);
    return new Energy(newCurrent, this.max);
  }

  withMaxCapacity(newMax: number): Energy {
    if (newMax <= 0) {
      throw new Error('Max energy must be positive');
    }
    const capped = Math.min(this.current, newMax);
    return new Energy(capped, newMax);
  }

  equals(other: Energy): boolean {
    return this.current === other.current && this.max === other.max;
  }
}
