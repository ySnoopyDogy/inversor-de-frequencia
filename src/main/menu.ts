import { Menu, BrowserWindow, Notification, app } from 'electron';
import path from 'path';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    this.setupContextMenu();

    const template = this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupContextMenu(): void {
    this.mainWindow.webContents.on('context-menu', () => {
      const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

      const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
      };

      Menu.buildFromTemplate([
        {
          label: 'Venham a mim, camaradas',
          click: () => {
            const notifica = new Notification({
              title: 'Karl Marx',
              body: 'Proletarier aller Länder, vereinigt euch!',
              silent: false,
              icon: getAssetPath('marx.jpg'),
            });

            notifica.on('click', () => {
              this.mainWindow.webContents.send('message', {
                type: 'FOICE_E_MARTELO',
                state: getAssetPath('sovietico.mp3'),
              });
            });

            notifica.show();
          },
        },
        {
          label: 'Chega!',
          click: () => {
            this.mainWindow.webContents.send('message', {
              type: 'PARE',
            });
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  buildDefaultTemplate() {
    return [];
  }
}
