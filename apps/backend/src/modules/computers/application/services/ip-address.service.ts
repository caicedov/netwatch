import { Injectable } from '@nestjs/common';
import { ComputerRepository } from '../../infrastructure/persistence/computer.repository';

/**
 * IP Address Generation Service
 *
 * Generates unique, deterministic IP addresses for computers.
 * Uses private IP range 10.0.0.0/8 to avoid conflicts with real IPs.
 * Enforces uniqueness via database UNIQUE constraint.
 */
@Injectable()
export class IPAddressService {
  private readonly maxRetries = 100;
  private readonly ipRangeStart = 10;

  constructor(private readonly computerRepository: ComputerRepository) {}

  /**
   * Generate a unique IP address for a new computer.
   *
   * @returns Promise<string> unique IP in format 10.X.Y.Z
   * @throws Error if max retries exceeded (IP space collision saturation)
   */
  async generateUniqueIP(): Promise<string> {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      const ip = this.generateRandomIP();
      const existing = await this.computerRepository.findByIpAddress(ip);

      if (!existing) {
        return ip;
      }

      attempts++;
    }

    throw new Error('Could not generate unique IP address after max retries');
  }

  /**
   * Generate random IP in private range 10.0.0.0/8.
   * Each octet 1-255 (avoid 0 for clarity).
   *
   * @returns string IP address
   */
  private generateRandomIP(): string {
    const octet1 = this.ipRangeStart;
    const octet2 = this.randomOctet();
    const octet3 = this.randomOctet();
    const octet4 = this.randomOctet();

    return `${octet1}.${octet2}.${octet3}.${octet4}`;
  }

  /**
   * Generate random octet value (1-255).
   */
  private randomOctet(): number {
    return Math.floor(Math.random() * 254) + 1;
  }
}
