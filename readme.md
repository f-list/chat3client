# Chat 3 Client <!-- omit in toc -->
Open-source components of F-List and F-Chat 3.0. This repo builds the client as an Electron desktop app, a mobile bundle, or a web bundle.

- [Maintainers](#maintainers)
- [Repo layout](#repo-layout)
- [Prerequisites](#prerequisites)
- [Install](#install)
- [Build targets](#build-targets)
  - [Electron](#electron)
    - [Packaging (electron-builder)](#packaging-electron-builder)
    - [Cross-platform packaging script](#cross-platform-packaging-script)
  - [Mobile](#mobile)
  - [Webchat](#webchat)
  - [Custom themes](#custom-themes)
- [Dependencies](#dependencies)
- [Contributing](#contributing)


## Maintainers
- @CodingWithAnxiety, Rose, <rose@f-list.net> 
- @AnikoAniko, Aniko, <aniko@f-list.net>

## Repo layout
- `electron/` - Electron desktop app
- `mobile/` - Cordova/Capacitor-style mobile app
- `webchat/` - Web build
- `scss/` - Theme sources

## Prerequisites
- Node.js 22 (see `.nvmrc`)
- pnpm 10
- (optional) [fnm](https://github.com/Schniz/fnm)

## Install
- Clone the repo
- `pnpm i`

## Build targets

### Electron
- `pnpm -C electron build` or `pnpm -C electron watch`
- `pnpm -C electron start`

#### Packaging (electron-builder)
- `pnpm -C electron build:dist`
- `pnpm -C electron pack`

#### Cross-platform packaging script
`electron/build/build.mjs` wraps electron-builder and optionally uses Docker.
- `pnpm -C electron build:win` (Windows, nsis)
- `pnpm -C electron build:linux` (Linux, deb + AppImage)
- `pnpm -C electron build:mac` (macOS, dmg + zip)
- Or call directly:
  - `node electron/build/build.mjs --os linux --format deb AppImage`
  - `node electron/build/build.mjs --os windows --arch x64 ia32`
  - `node electron/build/build.mjs --os linux --docker` to force Docker

### Mobile
- `pnpm -C mobile build` or `pnpm -C mobile watch`
- Android: `cd mobile/android && ./gradlew assembleDebug`
- iOS: open `mobile/ios/F-Chat.xcodeproj` in Xcode and run

### Webchat
- `pnpm -C webchat build` or `pnpm -C webchat watch`
- Webchat uses the root webpack config, so make sure the root dependencies are installed first.
- Output is written to `webchat/dist`
- The compiled `main.js` expects a global:
  `const chatSettings: {account: string, theme: string, characters: ReadonlyArray<string>, defaultCharacter: string | null};`
  and a page that normalizes to 100% height.

### Custom themes
See the wiki for theme creation details: https://wiki.f-list.net/F-Chat_3.0/Themes
- `pnpm -C scss install`
- `pnpm -C scss build`
- Output CSS lands in `scss/css`

## Dependencies
Dependency upgrades should be done deliberately and verified.
- Lockfile: `pnpm-lock.yaml` (created on first `pnpm install`)
- Updates: `pnpm update`
- Audit outdated: `pnpm outdated`

## Contributing
Read [CONTRIBUTING.md](./CONTRIBUTING.md).