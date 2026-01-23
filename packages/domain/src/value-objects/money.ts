/**
 * Money Value Object
 *
 * Represents in-game currency.
 * Immutable, enforces non-negative constraint.
 */
export class Money {
  private readonly amount: bigint;

  private constructor(amount: bigint) {
    if (amount < 0n) {
      throw new Error('Money amount cannot be negative');
    }
    this.amount = amount;
  }

  static create(amount: number | bigint): Money {
    return new Money(typeof amount === 'number' ? BigInt(amount) : amount);
  }

  static zero(): Money {
    return new Money(0n);
  }

  getValue(): bigint {
    return this.amount;
  }

  toNumber(): number {
    return Number(this.amount);
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    if (other.amount > this.amount) {
      throw new Error('Insufficient funds');
    }
    return new Money(this.amount - other.amount);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.amount >= other.amount;
  }

  isEqual(other: Money): boolean {
    return this.amount === other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
