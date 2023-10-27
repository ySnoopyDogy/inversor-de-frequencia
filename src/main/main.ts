/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { SerialPort } from 'serialport';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

let mainWindow: BrowserWindow | null = null;

let lookupTimer: NodeJS.Timer;
let heartbeatTimeout: NodeJS.Timeout;

let mainSerial: SerialPort;

const lookForArm = async () => {
  lookupTimer = setInterval(async (): Promise<void> => {
    const found = await SerialPort.list();

    const filtered = found.filter((a) =>
      a.manufacturer?.toLowerCase()?.includes('stm')
    );

    if (filtered.length === 0) {
      mainWindow?.webContents.send('message', { type: 'ARM', state: false });
      return;
    }

    mainSerial = new SerialPort({
      baudRate: 19200,
      path: filtered[0].path,
      parity: 'none',
      stopBits: 1,
    });

    mainSerial.write('R...');

    clearInterval(lookupTimer);

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setupSerial();

    mainWindow?.webContents.send('message', { type: 'ARM', state: true });
  }, 2000);
};

const setupSerial = () => {
  mainSerial.on('data', (d) => {
    const MESSAGE = Buffer.from(d).toString('utf8');

    if (MESSAGE.startsWith('H')) {
      clearTimeout(heartbeatTimeout);
      mainWindow?.webContents.send('message', { type: 'ACK' });

      heartbeatTimeout = setTimeout(() => {
        mainWindow?.webContents.send('message', { type: 'ARM', state: false });
        lookForArm();
      }, 3000);
    }
  });
};

const padLeadingZeros = (num: number) => {
  let s = `${num}`;
  while (s.length < 3) s = `0${s}`;
  return s;
};

ipcMain.on('message', async (_, msg) => {
  if (msg.type === 'MOTOR') {
    mainSerial.write(`${msg.state ? 'L' : 'D'}...`);
  }

  if (msg.type === 'FREQ') {
    mainSerial.write(`F${padLeadingZeros(msg.state)}`);
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.jpg'),
    darkTheme: true,
    webPreferences: {
      webSecurity: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    lookForArm();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
