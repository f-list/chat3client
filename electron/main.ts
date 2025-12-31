/**
 * @license
 * MIT License
 *
 * Copyright (c) 2018 F-List
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * This license header applies to this file and all of the non-third-party assets it includes.
 * @file The entry point for the Electron main thread of F-Chat 3.0.
 * @copyright 2018 F-List
 * @author Maya Wolf <maya@f-list.net>
 * @version 3.0
 * @see {@link https://github.com/f-list/exported|GitHub repo}
 */
import * as electron from 'electron';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as remoteMain from '@electron/remote/main';
import l from '../chat/localize';
import {defaultHost, GeneralSettings} from './common';
import * as windowState from './window_state';
import BrowserWindow = Electron.BrowserWindow;
import MenuItem = Electron.MenuItem;

// Module to control application life.
const app = electron.app;
remoteMain.initialize();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows: Electron.BrowserWindow[] = [];
const characters: string[] = [];
let tabCount = 0;

const baseDir = app.getPath('userData');
fs.mkdirSync(baseDir, {recursive: true});
let shouldImportSettings = false;

const settingsDir = path.join(baseDir, 'data');
fs.mkdirSync(settingsDir, {recursive: true});
const settingsFile = path.join(settingsDir, 'settings');
const settings = new GeneralSettings();

if(!fs.existsSync(settingsFile)) shouldImportSettings = true;
else
    try {
        Object.assign(settings, <GeneralSettings>JSON.parse(fs.readFileSync(settingsFile, 'utf8')));
    } catch(e) {
        log.error(`Error loading settings: ${e}`);
    }

if(!settings.hwAcceleration) {
    log.info('Disabling hardware acceleration.');
    app.disableHardwareAcceleration();
}

function getSafeLanguages(lang: string | undefined, available: string[]): string[] {
    if(lang === undefined) return [];
    const normalized = lang.replace('_', '-');
    if(available.indexOf(normalized) !== -1) return [normalized];
    if(available.indexOf('en-GB') !== -1) return ['en-GB'];
    return [];
}

function setDictionary(lang: string | undefined): void {
    settings.spellcheckLang = lang;
    setGeneralSettings(settings);
    const available = electron.session.defaultSession.availableSpellCheckerLanguages;
    const safeLanguages = getSafeLanguages(lang, available);
    electron.session.defaultSession.setSpellCheckerLanguages(safeLanguages);
    for(const w of electron.webContents.getAllWebContents()) {
        w.session.setSpellCheckerLanguages(safeLanguages);
    }
}

function setGeneralSettings(value: GeneralSettings): void {
    fs.writeFileSync(path.join(settingsDir, 'settings'), JSON.stringify(value));
    for(const w of electron.webContents.getAllWebContents()) w.send('settings', settings);
    shouldImportSettings = false;
}

async function addSpellcheckerItems(menu: Electron.Menu): Promise<void> {
    const available = electron.session.defaultSession.availableSpellCheckerLanguages;
    const safeLanguages = getSafeLanguages(settings.spellcheckLang, available);
    menu.append(new electron.MenuItem({
        type: 'radio',
        label: l('settings.spellcheck.disabled'),
        checked: safeLanguages.length === 0,
        click: () => setDictionary(undefined)
    }));
    for(const lang of available)
        menu.append(new electron.MenuItem({
            type: 'radio',
            label: lang,
            checked: safeLanguages.indexOf(lang) !== -1,
            click: () => setDictionary(lang)
        }));
}

function setUpWebContents(webContents: Electron.WebContents): void {
    const handleLink = (linkUrl: string) => {
        const profileMatch = linkUrl.match(/^https?:\/\/(www\.)?f-list.net\/c\/([^/#]+)\/?#?/);
        if(profileMatch !== null && settings.profileViewer) webContents.send('open-profile', decodeURIComponent(profileMatch[2]));
        else return electron.shell.openExternal(linkUrl);
    };

    webContents.on('will-navigate', (event, linkUrl) => {
        event.preventDefault();
        handleLink(linkUrl);
    });
    webContents.setWindowOpenHandler(({url: linkUrl}) => {
        handleLink(linkUrl);
        return {action: 'deny'};
    });
}

function createWindow(): Electron.BrowserWindow | undefined {
    if(tabCount >= 3) return;
    const lastState = windowState.getSavedWindowState();
    const windowProperties: Electron.BrowserWindowConstructorOptions & {maximized: boolean} = {
        ...lastState,
        center: lastState.x === undefined,
        show: false,
        webPreferences: {nodeIntegration: true, contextIsolation: false, spellcheck: true}
    };
    if(process.platform === 'darwin') windowProperties.titleBarStyle = 'hiddenInset';
    else windowProperties.frame = false;
    const window = new electron.BrowserWindow(windowProperties);
    windows.push(window);
    remoteMain.enable(window.webContents);

    window.loadURL(url.format({ //tslint:disable-line:no-floating-promises
        pathname: path.join(__dirname, 'window.html'),
        protocol: 'file:',
        slashes: true,
        query: {settings: JSON.stringify(settings), import: shouldImportSettings ? 'true' : []}
    }));

    setUpWebContents(window.webContents);

    // Save window state when it is being closed.
    window.on('close', () => windowState.setSavedWindowState(window));
    window.on('closed', () => windows.splice(windows.indexOf(window), 1));
    window.once('ready-to-show', () => {
        window.show();
        if(lastState.maximized) window.maximize();
    });
    return window;
}

function showPatchNotes(): void {
    electron.shell.openExternal('https://wiki.f-list.net/F-Chat_3.0#Changelog'); //tslint:disable-line:no-floating-promises
}

function onReady(): void {
    log.transports.file.level = 'debug';
    log.transports.console.level = 'debug';
    log.transports.file.maxSize = 5 * 1024 * 1024;
    log.transports.file.file = path.join(baseDir, 'log.txt');
    log.info('Starting application.');

    app.setAppUserModelId('com.squirrel.fchat.F-Chat');
    app.on('open-file', createWindow);

    const availableLanguages = electron.session.defaultSession.availableSpellCheckerLanguages;
    electron.session.defaultSession.setSpellCheckerLanguages(
        getSafeLanguages(settings.spellcheckLang, availableLanguages)
    );

    if(settings.version !== app.getVersion()) {
        showPatchNotes();
        if(settings.host === 'wss://chat.f-list.net:9799')
            settings.host = defaultHost;
        settings.version = app.getVersion();
        setGeneralSettings(settings);
    }

    const updaterUrl = `https://client.f-list.net/${process.platform}`;
    if(process.env.NODE_ENV === 'production') {
        electron.autoUpdater.setFeedURL({url: updaterUrl + (settings.beta ? '?channel=beta' : ''), serverType: 'json'});
        setTimeout(() => electron.autoUpdater.checkForUpdates(), 10000);
        const updateTimer = setInterval(() => electron.autoUpdater.checkForUpdates(), 3600000);
        electron.autoUpdater.on('update-downloaded', () => {
            clearInterval(updateTimer);
            const menu = electron.Menu.getApplicationMenu()!;
            const item = menu.getMenuItemById('update') as MenuItem | null;
            if(item !== null) item.visible = true;
            else
                menu.append(new electron.MenuItem({
                    label: l('action.updateAvailable'),
                    submenu: electron.Menu.buildFromTemplate([{
                        label: l('action.update'),
                        click: () => {
                            for(const w of windows) w.webContents.send('quit');
                            electron.autoUpdater.quitAndInstall();
                        }
                    }, {
                        label: l('help.changelog'),
                        click: showPatchNotes
                    }]),
                    id: 'update'
                }));
            electron.Menu.setApplicationMenu(menu);
            for(const w of windows) w.webContents.send('update-available', true);
        });
        electron.autoUpdater.on('update-not-available', () => {
            for(const w of windows) w.webContents.send('update-available', false);
            const item = electron.Menu.getApplicationMenu()!.getMenuItemById('update') as MenuItem | null;
            if(item !== null) item.visible = false;
        });
        electron.autoUpdater.on('error', (e) => log.error(e));
    }

    const viewItem = {
        label: `&${l('action.view')}`,
        submenu: <Electron.MenuItemConstructorOptions[]>[
            {role: 'resetZoom'},
            {role: 'zoomIn'},
            {role: 'zoomOut'},
            {type: 'separator'},
            {role: 'togglefullscreen'}
        ]
    };
    if(process.env.NODE_ENV !== 'production')
        viewItem.submenu.unshift({role: 'reload'}, {role: 'forceReload'}, {role: 'toggleDevTools'}, {type: 'separator'});
    const spellcheckerMenu = new electron.Menu();
    //tslint:disable-next-line:no-floating-promises
    addSpellcheckerItems(spellcheckerMenu);
    const themes = fs.readdirSync(path.join(__dirname, 'themes')).filter((x) => x.substr(-4) === '.css').map((x) => x.slice(0, -4));
    const setTheme = (theme: string) => {
        settings.theme = theme;
        setGeneralSettings(settings);
    };
    electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate([
        {
            label: `&${l('title')}`,
            submenu: [
                {label: l('action.newWindow'), click: createWindow, accelerator: 'CmdOrCtrl+n'},
                {
                    label: l('action.newTab'),
                    click: (_item, window) => {
                        const target = window instanceof electron.BrowserWindow ? window : electron.BrowserWindow.getFocusedWindow();
                        if(!target || tabCount >= 3) return;
                        target.webContents.send('open-tab');
                    },
                    accelerator: 'CmdOrCtrl+t'
                },
                {
                    label: l('settings.logDir'),
                    click: async(_item, window) => {
                        if(!window) return;
                        const result = await electron.dialog.showOpenDialog(window, {
                            defaultPath: settings.logDirectory,
                            properties: ['openDirectory']
                        });
                        if(result.canceled || result.filePaths.length === 0) return;
                        const dir = result.filePaths[0];
                        if(dir.startsWith(path.dirname(app.getPath('exe'))))
                            return electron.dialog.showErrorBox(l('settings.logDir'), l('settings.logDir.inAppDir'));
                        const {response} = await electron.dialog.showMessageBox(window, {
                            message: l('settings.logDir.confirm', dir, settings.logDirectory),
                            buttons: [l('confirmYes'), l('confirmNo')],
                            cancelId: 1
                        });
                        if(response === 0) {
                            for(const w of windows) w.webContents.send('quit');
                            settings.logDirectory = dir;
                            setGeneralSettings(settings);
                            app.quit();
                        }
                    }
                },
                {
                    label: l('settings.closeToTray'), type: 'checkbox', checked: settings.closeToTray,
                    click: (item: Electron.MenuItem) => {
                        settings.closeToTray = item.checked;
                        setGeneralSettings(settings);
                    }
                }, {
                    label: l('settings.profileViewer'), type: 'checkbox', checked: settings.profileViewer,
                    click: (item: Electron.MenuItem) => {
                        settings.profileViewer = item.checked;
                        setGeneralSettings(settings);
                    }
                },
                {label: l('settings.spellcheck'), submenu: spellcheckerMenu},
                {
                    label: l('settings.theme'),
                    submenu: themes.map((x) => ({
                        checked: settings.theme === x,
                        click: () => setTheme(x),
                        label: x,
                        type: <'radio'>'radio'
                    }))
                }, {
                    label: l('settings.hwAcceleration'), type: 'checkbox', checked: settings.hwAcceleration,
                    click: (item: Electron.MenuItem) => {
                        settings.hwAcceleration = item.checked;
                        setGeneralSettings(settings);
                    }
                }, {
                    label: l('settings.beta'), type: 'checkbox', checked: settings.beta,
                    click: async(item: Electron.MenuItem) => {
                        settings.beta = item.checked;
                        setGeneralSettings(settings);
                        electron.autoUpdater.setFeedURL({url: updaterUrl + (item.checked ? '?channel=beta' : ''), serverType: 'json'});
                        return electron.autoUpdater.checkForUpdates();
                    }
                }, {
                    label: l('fixLogs.action'),
                    click: (_item, window) => {
                        const target = window instanceof electron.BrowserWindow ? window : electron.BrowserWindow.getFocusedWindow();
                        if(!target) return;
                        target.webContents.send('fix-logs');
                    }
                },
                {type: 'separator'},
                {role: 'minimize'},
                {
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : undefined,
                    label: l('action.quit'),
                    click: async(_item, window): Promise<void> => {
                        if(characters.length === 0) return app.quit();
                        if(!window) return;
                        const {response} = await electron.dialog.showMessageBox(window, {
                            message: l('chat.confirmLeave'),
                            buttons: [l('confirmYes'), l('confirmNo')],
                            cancelId: 1
                        });
                        if(response === 0) {
                            for(const w of windows) w.webContents.send('quit');
                            app.quit();
                        }
                    }
                }
            ]
        }, {
            label: `&${l('action.edit')}`,
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'selectAll'}
            ]
        }, viewItem, {
            label: `&${l('help')}`,
            submenu: [
                {
                    label: l('help.fchat'),
                    click: () => electron.shell.openExternal('https://wiki.f-list.net/F-Chat_3.0')
                },
                {
                    label: l('help.feedback'),
                    click: () => electron.shell.openExternal('https://goo.gl/forms/WnLt3Qm3TPt64jQt2')
                },
                {
                    label: l('help.rules'),
                    click: () => electron.shell.openExternal('https://wiki.f-list.net/Rules')
                },
                {
                    label: l('help.faq'),
                    click: () => electron.shell.openExternal('https://wiki.f-list.net/Frequently_Asked_Questions')
                },
                {
                    label: l('help.report'),
                    click: () => electron.shell.openExternal('https://wiki.f-list.net/How_to_Report_a_User#In_chat')
                },
                {label: l('version', app.getVersion()), click: showPatchNotes}
            ]
        }
    ]));
    electron.ipcMain.on('tab-added', (_event: Electron.IpcMainEvent, id: number) => {
        const webContents = electron.webContents.fromId(id);
        if(webContents !== undefined) {
            setUpWebContents(webContents);
            const available = electron.session.defaultSession.availableSpellCheckerLanguages;
            webContents.session.setSpellCheckerLanguages(getSafeLanguages(settings.spellcheckLang, available));
            remoteMain.enable(webContents);
        }
        ++tabCount;
        if(tabCount === 3)
            for(const w of windows) w.webContents.send('allow-new-tabs', false);
    });
    electron.ipcMain.on('tab-closed', () => {
        --tabCount;
        for(const w of windows) w.webContents.send('allow-new-tabs', true);
    });
    electron.ipcMain.on('save-login', (_event: Electron.IpcMainEvent, account: string, host: string) => {
        settings.account = account;
        settings.host = host;
        setGeneralSettings(settings);
    });
    electron.ipcMain.on('connect', (event: Electron.IpcMainEvent, character: string) => {
        if(characters.indexOf(character) !== -1) return event.returnValue = false;
        characters.push(character);
        event.returnValue = true;
    });
    electron.ipcMain.on('dictionary-add', (_event: Electron.IpcMainEvent, word: string) => {
        electron.session.defaultSession.addWordToSpellCheckerDictionary(word);
        for(const w of electron.webContents.getAllWebContents()) {
            w.session.addWordToSpellCheckerDictionary(word);
        }
    });
    electron.ipcMain.on('dictionary-remove', (_event: Electron.IpcMainEvent, _word: string) => {
        // Electron does not support removing words from the spellchecker dictionary.
    });
    electron.ipcMain.on('disconnect', (_event: Electron.IpcMainEvent, character: string) => {
        const index = characters.indexOf(character);
        if(index !== -1) characters.splice(index, 1);
    });
    const emptyBadge = electron.nativeImage.createEmpty();
    //tslint:disable-next-line:no-require-imports
    const badge = electron.nativeImage.createFromPath(path.join(__dirname, <string>require('./build/badge.png')));
    electron.ipcMain.on('has-new', (event: Electron.IpcMainEvent, hasNew: boolean) => {
        if(process.platform === 'darwin' && app.dock) app.dock.setBadge(hasNew ? '!' : '');
        const window = electron.BrowserWindow.fromWebContents(event.sender) as BrowserWindow | undefined;
        if(window !== undefined) window.setOverlayIcon(hasNew ? badge : emptyBadge, hasNew ? 'New messages' : '');
    });
    createWindow();
}

const isSquirrelStart = require('electron-squirrel-startup'); //tslint:disable-line:no-require-imports
if(isSquirrelStart || process.env.NODE_ENV === 'production' && !app.requestSingleInstanceLock()) app.quit();
else app.on('ready', onReady);
app.on('second-instance', createWindow);
app.on('window-all-closed', () => app.quit());
