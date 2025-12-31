/**
 * Build script (ported from Horizon) for cross-platform packaging via electron-builder.
 *
 * Usage:
 *   node build/build.mjs --os <macos|linux|windows> [options]
 */

import { program } from 'commander';
import { arch as systemArch } from 'os';
import { build } from 'electron-builder';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  isDockerAvailable,
  shouldUseDocker,
  runDockerBuild
} from './docker-config.mjs';

const COLORS = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m'
};

const OS_CONFIGS = {
  macos: {
    aliases: ['mac'],
    formats: ['dmg', 'zip', 'dir'],
    arches: ['x64', 'arm64', 'universal']
  },
  linux: {
    aliases: ['unix', 'linux64', 'linux32'],
    formats: ['deb', 'rpm', 'tar.gz', 'AppImage'],
    arches: ['x64', 'arm64', 'armv7l', 'ia32']
  },
  windows: {
    aliases: ['win', 'win32', 'win64'],
    formats: ['exe', 'msi', 'nsis', 'portable'],
    arches: ['x64', 'ia32', 'arm64']
  }
};

function setupProgram() {
  const extraHelp = `
Examples:
  node build/build.mjs --os linux                    # Build for Linux (default format: deb, arch: x64)
  node build/build.mjs --os macos -f dmg zip         # Build for macOS with dmg and zip formats
  node build/build.mjs --os windows -a x64 ia32      # Build for Windows with x64 and ia32 architectures
  node build/build.mjs --os linux --docker           # Force Docker build for Linux
  node build/build.mjs --os macos --no-docker        # Disable Docker for macOS (already disabled by default)

Supported formats by OS:
  macOS:   dmg, zip, dir
  Linux:   deb, rpm, tar.gz, AppImage
  Windows: exe, msi, nsis, portable

Supported architectures by OS:
  macOS:   x64, arm64, universal
  Linux:   x64, arm64, arm7l, ia32
  Windows: x64, ia32, arm64
`;

  const p = program
    .name('build.mjs')
    .description('Build script for the Exported Electron application')
    .requiredOption('--os <os>', 'Target OS (macos, linux, windows)')
    .option('-f, --format <formats...>', 'Output formats')
    .option('-a, --arch <arches...>', 'Target architectures')
    .option('-v, --version <version>', 'App version')
    .option('--docker', 'Force Docker builds')
    .option('--no-docker', 'Disable Docker builds');

  if (typeof p.addHelpText === 'function') {
    p.addHelpText('after', extraHelp);
  } else {
    p.on('--help', () => {
      console.log(extraHelp);
    });
  }

  if (typeof p.configureOutput === 'function') {
    p.configureOutput({
      outputError: (str, write) => {
        if (str.includes("required option '--os <os>' not specified")) {
          write(
            `${COLORS.red}Error: Missing required option --os${COLORS.reset}\n`
          );
          write(
            `${COLORS.yellow}Usage: node build/build.mjs --os <macos|linux|windows> [options]${COLORS.reset}\n`
          );
          write(
            `${COLORS.cyan}Run 'node build/build.mjs --help' for detailed usage information.${COLORS.reset}\n`
          );
        } else {
          write(str);
        }
      }
    });
  }

  return p;
}

function findTargetOS(osInput) {
  return Object.keys(OS_CONFIGS).find(
    key =>
      key === osInput.toLowerCase() ||
      OS_CONFIGS[key].aliases.includes(osInput.toLowerCase())
  );
}

function setDefaults(opts, config) {
  const { formats: defaultFormats, arches: defaultArches } = config;

  if (typeof opts.format === 'string') opts.format = [opts.format];
  if (typeof opts.arch === 'string') opts.arch = [opts.arch];

  opts.format = opts.format?.length ? opts.format : [defaultFormats[0]];
  opts.arch = opts.arch?.length
    ? opts.arch
    : [defaultArches.includes(systemArch()) ? systemArch() : defaultArches[0]];
}

function validateOptions(opts, config, targetKey) {
  const { formats: validFormats, arches: validArches } = config;
  const invalidFormats = opts.format.filter(f => !validFormats.includes(f));
  const invalidArches = opts.arch.filter(a => !validArches.includes(a));

  if (invalidFormats.length || invalidArches.length) {
    console.error(
      `${COLORS.red}Invalid options for ${targetKey}:${COLORS.reset}`
    );
    if (invalidFormats.length) {
      console.error(`  Formats: ${invalidFormats.join(', ')}`);
    }
    if (invalidArches.length) {
      console.error(`  Architectures: ${invalidArches.join(', ')}`);
    }
    process.exit(1);
  }
}

async function runNativeBuild(opts, targetKey) {
  console.log('Starting native build...');

  const packageJsonPath = path.resolve('../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const baseConfig = packageJson.build || {};

  const platformMap = {
    linux: 'linux',
    macos: 'mac',
    windows: 'win'
  };

  const targets = opts.format.flatMap(format =>
    opts.arch.map(arch => ({
      target: format,
      arch: arch
    }))
  );

  const config = {
    ...baseConfig,
    [platformMap[targetKey]]: { target: targets }
  };

  await build({ config });
  console.log('Build completed successfully!');
}

(async () => {
  const opts = setupProgram().parse(process.argv).opts();

  const targetKey = findTargetOS(opts.os);
  if (!targetKey) {
    console.error(`${COLORS.red}Invalid OS: ${opts.os}${COLORS.reset}`);
    process.exit(1);
  }

  const targetConfig = OS_CONFIGS[targetKey];
  setDefaults(opts, targetConfig);
  validateOptions(opts, targetConfig, targetKey);

  console.log(
    `${COLORS.cyan}Building for ${targetKey} | formats: ${opts.format.join(', ')} | arches: ${opts.arch.join(', ')}${COLORS.reset}`
  );

  if (shouldUseDocker(opts, targetKey, COLORS)) {
    runDockerBuild(opts, targetKey);
  } else {
    await runNativeBuild(opts, targetKey);
  }
})();
