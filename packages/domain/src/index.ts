/**
 * Domain Layer - Pure Business Logic
 *
 * This package contains domain models with ZERO framework imports.
 * It is used by both backend and frontend.
 *
 * Restrictions:
 * - NO NestJS imports
 * - NO React imports
 * - NO HTTP imports
 * - NO database imports
 * - NO side effects (pure functions)
 *
 * What's included:
 * - Entities
 * - Value Objects
 * - Aggregates
 * - Domain Events
 */

// Entities
export { User } from './entities/user.entity';
export {
    Player,
    type PlayerId,
    createPlayerId,
} from './entities/player.entity';
export {
    Computer,
    type ComputerId,
    createComputerId,
} from './entities/computer.entity';
export {
    Defense,
    DefenseType,
    type DefenseId,
    createDefenseId,
} from './entities/defense.entity';
export {
    HackOperation,
    HackStatus,
    HackType,
    type HackOperationId,
    createHackOperationId,
} from './entities/hack-operation.entity';
export {
    ProgressionUnlock,
    UnlockType,
    type ProgressionUnlockId,
    createProgressionUnlockId,
} from './entities/progression-unlock.entity';

// Value Objects
export { Money } from './value-objects/money';
export { Energy } from './value-objects/energy';
