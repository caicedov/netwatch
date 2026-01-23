import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1737648000000 implements MigrationInterface {
  name = 'InitialSchema1737648000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      CREATE TYPE defense_type AS ENUM ('firewall', 'antivirus', 'honeypot', 'ids');
    `);

    await queryRunner.query(`
      CREATE TYPE hack_status AS ENUM ('pending', 'in_progress', 'succeeded', 'failed', 'aborted');
    `);

    await queryRunner.query(`
      CREATE TYPE hack_type AS ENUM ('steal_money', 'steal_data', 'install_virus', 'ddos');
    `);

    await queryRunner.query(`
      CREATE TYPE unlock_type AS ENUM ('tool', 'defense', 'upgrade', 'skill');
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username        VARCHAR(20) UNIQUE NOT NULL,
        password_hash   VARCHAR(255) NOT NULL,
        email           VARCHAR(255) UNIQUE NULL,
        is_active       BOOLEAN DEFAULT true NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        last_login_at   TIMESTAMPTZ NULL,

        CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 20)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_created ON users(created_at);
    `);

    // Create players table
    await queryRunner.query(`
      CREATE TABLE players (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        display_name    VARCHAR(50) NOT NULL,
        energy          INTEGER DEFAULT 100 NOT NULL CHECK (energy >= 0),
        energy_max      INTEGER DEFAULT 100 NOT NULL CHECK (energy_max >= energy),
        money           BIGINT DEFAULT 0 NOT NULL CHECK (money >= 0),
        experience      BIGINT DEFAULT 0 NOT NULL CHECK (experience >= 0),
        level           INTEGER GENERATED ALWAYS AS (floor(sqrt(experience/100.0))::int) STORED,
        skill_points    INTEGER DEFAULT 0 NOT NULL CHECK (skill_points >= 0),
        created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

        CONSTRAINT player_energy_capacity CHECK (energy <= energy_max)
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_players_user ON players(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_players_level ON players(level);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_players_created ON players(created_at);
    `);

    // Create computers table
    await queryRunner.query(`
      CREATE TABLE computers (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        name            VARCHAR(50) NOT NULL,
        ip_address      VARCHAR(15) UNIQUE NOT NULL,
        storage         INTEGER DEFAULT 1000 NOT NULL CHECK (storage >= 0),
        cpu             INTEGER DEFAULT 100 NOT NULL CHECK (cpu >= 0),
        memory          INTEGER DEFAULT 512 NOT NULL CHECK (memory >= 0),
        is_online       BOOLEAN DEFAULT true NOT NULL,
        firewall_level  INTEGER DEFAULT 0 NOT NULL CHECK (firewall_level BETWEEN 0 AND 100),
        created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_computers_owner ON computers(owner_id);
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_computers_ip ON computers(ip_address);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_computers_online ON computers(is_online) WHERE is_online = true;
    `);

    // Create defenses table
    await queryRunner.query(`
      CREATE TABLE defenses (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        computer_id     UUID NOT NULL REFERENCES computers(id) ON DELETE CASCADE,
        defense_type    defense_type NOT NULL,
        level           INTEGER DEFAULT 1 NOT NULL CHECK (level BETWEEN 1 AND 5),
        installed_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,

        CONSTRAINT unique_defense_per_computer UNIQUE (computer_id, defense_type)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_defenses_computer ON defenses(computer_id);
    `);

    // Create hack_operations table
    await queryRunner.query(`
      CREATE TABLE hack_operations (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attacker_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        target_computer_id  UUID NOT NULL REFERENCES computers(id) ON DELETE CASCADE,
        status              hack_status DEFAULT 'pending' NOT NULL,
        hack_type           hack_type NOT NULL,
        tools_used          JSONB DEFAULT '[]'::jsonb NOT NULL,
        estimated_duration  INTEGER NOT NULL CHECK (estimated_duration > 0),
        started_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        completion_at       TIMESTAMPTZ NOT NULL,
        result_data         JSONB NULL,

        CONSTRAINT completion_after_start CHECK (completion_at > started_at)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_hack_attacker ON hack_operations(attacker_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_hack_target ON hack_operations(target_computer_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_hack_status ON hack_operations(status);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_hack_pending ON hack_operations(completion_at)
        WHERE status = 'in_progress';
    `);

    await queryRunner.query(`
      CREATE INDEX idx_hack_tools ON hack_operations USING GIN (tools_used);
    `);

    // Create progression_unlocks table
    await queryRunner.query(`
      CREATE TABLE progression_unlocks (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        unlock_type     unlock_type NOT NULL,
        unlock_key      VARCHAR(50) NOT NULL,
        unlocked_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,

        CONSTRAINT unique_player_unlock UNIQUE (player_id, unlock_key)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_unlocks_player ON progression_unlocks(player_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_unlocks_key ON progression_unlocks(unlock_key);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS progression_unlocks CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS hack_operations CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS defenses CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS computers CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS players CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE;`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS unlock_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS hack_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS hack_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS defense_type;`);
  }
}
