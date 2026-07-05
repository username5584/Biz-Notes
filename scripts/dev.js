#!/usr/bin/env node
const { spawn } = require('child_process');
const os = require('os');

const WORKSPACE_ROOT = './';

const EXPO_PUBLIC_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || 'localhost';
const METRO_PORT = process.env.METRO_PORT || '18115';

function runExpoCommand(args) {
  const command = 'expo';
  const fullArgs = [...args, '--port', METRO_PORT];

  console.log(`Running command: ${command} ${fullArgs.join(' ')}`);

  const child = spawn(command, fullArgs, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      EXPO_PUBLIC_DOMAIN: EXPO_PUBLIC_DOMAIN,
    },
  });

  child.on('error', (error) => {
    console.error(`Failed to start subprocess: ${error.message}`);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`Command exited with code ${code}`);
      process.exit(code);
    }
  });
}

let platform = process.argv[2] || '';

switch (platform) {
  case 'web':
    runExpoCommand(['start', '--web']);
    break;
  case 'android':
  if (os.platform() === 'win32') {
      if (!process.env.ANDROID_HOME) {
        console.warn('Android SDK не найден. Установи Android Studio и настрой переменную окружения ANDROID_HOME.');
        console.warn('   Для запуска на устройстве используй Expo Go: npm run dev');
        process.exit(1);
      }
    }
    runExpoCommand(['start', '--android', '--localhost']);
    break;
  case 'ios':
    if (os.platform() !== 'darwin') {
      console.error('iOS симулятор доступен только на macOS с установленным Xcode.');
      console.error('   Для запуска на устройстве используй Expo Go: npm run dev');
      process.exit(1);
    }
    runExpoCommand(['start', '--ios', '--localhost']);
    break;
  default:
    runExpoCommand(['start', '--tunnel']);
    break;
}
