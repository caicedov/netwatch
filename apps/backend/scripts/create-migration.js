#!/usr/bin/env node
/**
 * Helper script to create a new migration with automatic timestamp.
 * Usage:
 *   pnpm migration:new            # prompts for description
 *   pnpm migration:new "Add quests table"
 */
const { execSync } = require('child_process');
const readline = require('readline');

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'migration';
}

function askDescription() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Descripción de la migración: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  let description = process.argv.slice(2).join(' ');
  if (!description) {
    description = await askDescription();
  }

  if (!description || !description.trim()) {
    console.error('Debes ingresar una descripción para la migración.');
    process.exit(1);
  }

  const timestamp = Date.now();
  const name = `${timestamp}-${slugify(description)}`;
  const target = `./src/infrastructure/database/migrations/${name}`;
  const command = `pnpm migration:create ${target}`;

  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit' });
}

main().catch((err) => {
  console.error('Error creando la migración:', err);
  process.exit(1);
});
