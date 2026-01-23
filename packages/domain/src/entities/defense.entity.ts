/**
 * Defense Type Enum
 */
export enum DefenseType {
  FIREWALL = 'firewall',
  ANTIVIRUS = 'antivirus',
  HONEYPOT = 'honeypot',
  IDS = 'ids',
}

/**
 * Defense Entity
 *
 * Represents installed security software on a Computer.
 */
export type DefenseId = string & { readonly __defenseId: unique symbol };

export const createDefenseId = (id: string): DefenseId => id as DefenseId;

export class Defense {
  private readonly id: DefenseId;
  private readonly computerId: string;
  private readonly defenseType: DefenseType;
  private level: number;
  private readonly installedAt: Date;

  private constructor(
    id: DefenseId,
    computerId: string,
    defenseType: DefenseType,
    level: number,
    installedAt: Date,
  ) {
    if (level < 1 || level > 5) {
      throw new Error('Defense level must be between 1 and 5');
    }

    this.id = id;
    this.computerId = computerId;
    this.defenseType = defenseType;
    this.level = level;
    this.installedAt = installedAt;
  }

  static create(
    id: DefenseId,
    computerId: string,
    defenseType: DefenseType,
  ): Defense {
    return new Defense(id, computerId, defenseType, 1, new Date());
  }

  static fromPersistence(
    id: DefenseId,
    computerId: string,
    defenseType: DefenseType,
    level: number,
    installedAt: Date,
  ): Defense {
    return new Defense(id, computerId, defenseType, level, installedAt);
  }

  getId(): DefenseId {
    return this.id;
  }

  getComputerId(): string {
    return this.computerId;
  }

  getDefenseType(): DefenseType {
    return this.defenseType;
  }

  getLevel(): number {
    return this.level;
  }

  getInstalledAt(): Date {
    return new Date(this.installedAt);
  }

  getEffectiveness(): number {
    const baseEffectiveness = 20;
    const levelBonus = (this.level - 1) * 15;
    return baseEffectiveness + levelBonus;
  }

  canUpgrade(): boolean {
    return this.level < 5;
  }

  upgrade(): Defense {
    if (!this.canUpgrade()) {
      throw new Error('Defense already at maximum level');
    }

    return new Defense(
      this.id,
      this.computerId,
      this.defenseType,
      this.level + 1,
      this.installedAt,
    );
  }
}
