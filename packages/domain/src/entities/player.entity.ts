/**
 * Player Entity
 *
 * Represents a game character with resources and progression.
 * Root aggregate for the Player domain.
 */
import { Money } from '../value-objects/money';
import { Energy } from '../value-objects/energy';

export type PlayerId = string & { readonly __playerId: unique symbol };

export const createPlayerId = (id: string): PlayerId => id as PlayerId;

export class Player {
    private readonly id: PlayerId;
    private readonly userId: string;
    private readonly displayName: string;
    private readonly createdAt: Date;
    private energy: Energy;
    private money: Money;
    private experience: bigint;
    private skillPoints: number;

    private constructor(
        id: PlayerId,
        userId: string,
        displayName: string,
        createdAt: Date,
        energy: Energy,
        money: Money,
        experience: bigint,
        skillPoints: number,
    ) {
        if (displayName.length === 0 || displayName.length > 50) {
            throw new Error('Display name must be 1-50 characters');
        }
        if (skillPoints < 0) {
            throw new Error('Skill points cannot be negative');
        }

        this.id = id;
        this.userId = userId;
        this.displayName = displayName;
        this.createdAt = createdAt;
        this.energy = energy;
        this.money = money;
        this.experience = experience;
        this.skillPoints = skillPoints;
    }

    static create(
        id: PlayerId,
        userId: string,
        displayName: string,
    ): Player {
        return new Player(
            id,
            userId,
            displayName,
            new Date(),
            Energy.full(100),
            Money.zero(),
            0n,
            0,
        );
    }

    static fromPersistence(
        id: PlayerId,
        userId: string,
        displayName: string,
        createdAt: Date,
        energy: number,
        energyMax: number,
        money: bigint,
        experience: bigint,
        skillPoints: number,
    ): Player {
        return new Player(
            id,
            userId,
            displayName,
            createdAt,
            Energy.create(energy, energyMax),
            Money.create(money),
            experience,
            skillPoints,
        );
    }

    getId(): PlayerId {
        return this.id;
    }

    getUserId(): string {
        return this.userId;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    getEnergy(): Energy {
        return this.energy;
    }

    getMoney(): Money {
        return this.money;
    }

    getExperience(): bigint {
        return this.experience;
    }

    getLevel(): number {
        return Math.floor(Math.sqrt(Number(this.experience) / 100));
    }

    getSkillPoints(): number {
        return this.skillPoints;
    }

    canAfford(cost: Money): boolean {
        return this.money.isGreaterThanOrEqual(cost);
    }

    consumeEnergy(amount: number): Player {
        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            this.energy.consume(amount),
            this.money,
            this.experience,
            this.skillPoints,
        );
    }

    earnMoney(amount: Money): Player {
        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            this.energy,
            this.money.add(amount),
            this.experience,
            this.skillPoints,
        );
    }

    spendMoney(amount: Money): Player {
        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            this.energy,
            this.money.subtract(amount),
            this.experience,
            this.skillPoints,
        );
    }

    gainExperience(amount: bigint): Player {
        if (amount < 0n) {
            throw new Error('Cannot gain negative experience');
        }
        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            this.energy,
            this.money,
            this.experience + amount,
            this.skillPoints,
        );
    }

    regenerateEnergy(amount: number): Player {
        const oldLevel = this.getLevel();
        const newEnergy = this.energy.regenerate(amount);
        const newMaxEnergy = 100 + oldLevel * 10;
        const cappedEnergy = newEnergy.withMaxCapacity(newMaxEnergy);

        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            cappedEnergy,
            this.money,
            this.experience,
            this.skillPoints,
        );
    }

    addSkillPoints(amount: number): Player {
        if (amount < 0) {
            throw new Error('Cannot add negative skill points');
        }
        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            this.energy,
            this.money,
            this.experience,
            this.skillPoints + amount,
        );
    }

    consumeSkillPoints(amount: number): Player {
        if (amount < 0 || amount > this.skillPoints) {
            throw new Error('Insufficient skill points');
        }
        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            this.energy,
            this.money,
            this.experience,
            this.skillPoints - amount,
        );
    }

    increaseEnergyCapacity(): Player {
        const currentLevel = this.getLevel();
        const newMaxEnergy = 100 + (currentLevel + 1) * 10;
        const newEnergy = this.energy.withMaxCapacity(newMaxEnergy);

        return new Player(
            this.id,
            this.userId,
            this.displayName,
            this.createdAt,
            newEnergy,
            this.money,
            this.experience,
            this.skillPoints,
        );
    }
}
