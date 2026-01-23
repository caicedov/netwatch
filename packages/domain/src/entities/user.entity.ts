/**
 * User Entity
 *
 * Represents authentication and account data for human players.
 * Root aggregate for the User domain.
 */
export class User {
  private readonly id: string;
  private readonly username: string;
  private readonly passwordHash: string;
  private readonly email: string | null;
  private readonly createdAt: Date;
  private lastLoginAt: Date | null;
  private isActive: boolean;

  private constructor(
    id: string,
    username: string,
    passwordHash: string,
    email: string | null,
    createdAt: Date,
    lastLoginAt: Date | null,
    isActive: boolean,
  ) {
    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be 3-20 characters');
    }
    if (email && !this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    this.id = id;
    this.username = username;
    this.passwordHash = passwordHash;
    this.email = email;
    this.createdAt = createdAt;
    this.lastLoginAt = lastLoginAt;
    this.isActive = isActive;
  }

  static create(
    id: string,
    username: string,
    passwordHash: string,
    email?: string,
  ): User {
    return new User(id, username, passwordHash, email || null, new Date(), null, true);
  }

  static fromPersistence(
    id: string,
    username: string,
    passwordHash: string,
    email: string | null,
    createdAt: Date,
    lastLoginAt: Date | null,
    isActive: boolean,
  ): User {
    return new User(id, username, passwordHash, email, createdAt, lastLoginAt, isActive);
  }

  getId(): string {
    return this.id;
  }

  getUsername(): string {
    return this.username;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getEmail(): string | null {
    return this.email;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getLastLoginAt(): Date | null {
    return this.lastLoginAt ? new Date(this.lastLoginAt) : null;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  recordLogin(): User {
    return new User(
      this.id,
      this.username,
      this.passwordHash,
      this.email,
      this.createdAt,
      new Date(),
      this.isActive,
    );
  }

  suspend(): User {
    return new User(
      this.id,
      this.username,
      this.passwordHash,
      this.email,
      this.createdAt,
      this.lastLoginAt,
      false,
    );
  }

  activate(): User {
    return new User(
      this.id,
      this.username,
      this.passwordHash,
      this.email,
      this.createdAt,
      this.lastLoginAt,
      true,
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
