/**
 * Computer Entity
 *
 * Represents a virtual system owned by a player.
 * Can be hacked or defended against.
 */
export type ComputerId = string & { readonly __computerId: unique symbol };

export const createComputerId = (id: string): ComputerId => id as ComputerId;

export class Computer {
  private readonly id: ComputerId;
  private readonly ownerId: string;
  private readonly name: string;
  private readonly ipAddress: string;
  private readonly createdAt: Date;
  private storage: number;
  private cpu: number;
  private memory: number;
  private isOnline: boolean;
  private firewallLevel: number;

  private constructor(
    id: ComputerId,
    ownerId: string,
    name: string,
    ipAddress: string,
    createdAt: Date,
    storage: number,
    cpu: number,
    memory: number,
    isOnline: boolean,
    firewallLevel: number,
  ) {
    if (name.length === 0 || name.length > 50) {
      throw new Error('Computer name must be 1-50 characters');
    }
    if (storage < 0 || cpu < 0 || memory < 0) {
      throw new Error('Resources cannot be negative');
    }
    if (firewallLevel < 0 || firewallLevel > 100) {
      throw new Error('Firewall level must be between 0 and 100');
    }

    this.id = id;
    this.ownerId = ownerId;
    this.name = name;
    this.ipAddress = ipAddress;
    this.createdAt = createdAt;
    this.storage = storage;
    this.cpu = cpu;
    this.memory = memory;
    this.isOnline = isOnline;
    this.firewallLevel = firewallLevel;
  }

  static create(
    id: ComputerId,
    ownerId: string,
    name: string,
    ipAddress: string,
  ): Computer {
    return new Computer(id, ownerId, name, ipAddress, new Date(), 1000, 100, 512, true, 0);
  }

  static fromPersistence(
    id: ComputerId,
    ownerId: string,
    name: string,
    ipAddress: string,
    createdAt: Date,
    storage: number,
    cpu: number,
    memory: number,
    isOnline: boolean,
    firewallLevel: number,
  ): Computer {
    return new Computer(
      id,
      ownerId,
      name,
      ipAddress,
      createdAt,
      storage,
      cpu,
      memory,
      isOnline,
      firewallLevel,
    );
  }

  getId(): ComputerId {
    return this.id;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getName(): string {
    return this.name;
  }

  getIpAddress(): string {
    return this.ipAddress;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getStorage(): number {
    return this.storage;
  }

  getCpu(): number {
    return this.cpu;
  }

  getMemory(): number {
    return this.memory;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getFirewallLevel(): number {
    return this.firewallLevel;
  }

  isVulnerable(): boolean {
    return this.isOnline && this.firewallLevel < 100;
  }

  goOnline(): Computer {
    return new Computer(
      this.id,
      this.ownerId,
      this.name,
      this.ipAddress,
      this.createdAt,
      this.storage,
      this.cpu,
      this.memory,
      true,
      this.firewallLevel,
    );
  }

  goOffline(): Computer {
    return new Computer(
      this.id,
      this.ownerId,
      this.name,
      this.ipAddress,
      this.createdAt,
      this.storage,
      this.cpu,
      this.memory,
      false,
      this.firewallLevel,
    );
  }

  applyDamage(storageAmount: number, cpuAmount: number, memoryAmount: number): Computer {
    if (storageAmount < 0 || cpuAmount < 0 || memoryAmount < 0) {
      throw new Error('Damage amounts cannot be negative');
    }

    return new Computer(
      this.id,
      this.ownerId,
      this.name,
      this.ipAddress,
      this.createdAt,
      Math.max(0, this.storage - storageAmount),
      Math.max(0, this.cpu - cpuAmount),
      Math.max(0, this.memory - memoryAmount),
      this.isOnline,
      this.firewallLevel,
    );
  }

  upgradeFirewall(amount: number): Computer {
    if (amount < 0) {
      throw new Error('Firewall upgrade amount cannot be negative');
    }

    const newLevel = Math.min(100, this.firewallLevel + amount);

    return new Computer(
      this.id,
      this.ownerId,
      this.name,
      this.ipAddress,
      this.createdAt,
      this.storage,
      this.cpu,
      this.memory,
      this.isOnline,
      newLevel,
    );
  }

  upgradeResource(type: 'storage' | 'cpu' | 'memory', amount: number): Computer {
    if (amount < 0) {
      throw new Error('Upgrade amount cannot be negative');
    }

    let newStorage = this.storage;
    let newCpu = this.cpu;
    let newMemory = this.memory;

    if (type === 'storage') newStorage += amount;
    if (type === 'cpu') newCpu += amount;
    if (type === 'memory') newMemory += amount;

    return new Computer(
      this.id,
      this.ownerId,
      this.name,
      this.ipAddress,
      this.createdAt,
      newStorage,
      newCpu,
      newMemory,
      this.isOnline,
      this.firewallLevel,
    );
  }
}
