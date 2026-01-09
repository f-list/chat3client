# Contributing to Chat 3 Client <!-- omit in toc -->
Interested in contributing to F-Chat 3.0? This is where to start. 

## Table of Contents <!-- omit in toc -->
- [Beginnings](#beginnings)
  - [Repository Dependancies](#repository-dependancies)
    - [Mobile](#mobile)
  - [Setting up your development environment](#setting-up-your-development-environment)
  - [Building](#building)
    - [Electron](#electron)
    - [Webchat](#webchat)
    - [Themes](#themes)
  - [Project layout](#project-layout)
    - [Branches](#branches)
    - [Tags](#tags)
- [Style guidelines](#style-guidelines)

## Beginnings

Want to add a feature or fix a bug? This guide covers the basics for getting set up.

### Repository Dependancies
This repo is primarily **Vue 2**, **TypeScript**, and **JavaScript**. You will need:
- **Node.js 22** (see `.nvmrc`)
- **pnpm 10**
- Optional: **fnm** (or another Node version manager)
 
#### Mobile
- **Android**: Android Studio (includes SDK + platform tools), a recent JDK (17+ recommended), and Gradle (via the Android plugin).
- **iOS**: macOS with Xcode (includes Command Line Tools).
- 
### Setting up your development environment

```sh
git clone <repo-url>
cd chat3client
pnpm install
```

### Building
#### Electron

For development:

```sh
pnpm -C electron build
pnpm -C electron start
```

For distribution (electron-builder):

```sh
pnpm -C electron build:dist
pnpm -C electron pack
```

Cross-platform packaging script (`electron/build/build.mjs`):

```sh
pnpm -C electron build:win
pnpm -C electron build:linux
pnpm -C electron build:mac
```

Direct usage:

```sh
node electron/build/build.mjs --os linux --format deb AppImage
node electron/build/build.mjs --os windows --arch x64 ia32
node electron/build/build.mjs --os linux --docker
```

```sh
pnpm -C mobile build
```

Android:

```sh
cd mobile/android
./gradlew assembleDebug
```

iOS:

Open `mobile/ios/F-Chat.xcodeproj` in Xcode and run.

#### Webchat

```sh
pnpm -C webchat build
```

#### Themes

```sh
pnpm -C scss install
pnpm -C scss build
```

Output lands in `scss/css`.

### Project layout

#### Branches

- **master**: stable releases
- **development**: integration branch for active work
- **feature/***: new features
- **fix/***: bug fixes
- **hotfix/***: urgent production fixes

#### Tags

We follow semantic versioning:
- **vX.Y.Z**: stable release
- **vX.Y.Z-DEV-X.Y**: pre-release
- **vX.Y.Z-rc-X.Y**: release candidate

## Style guidelines

Currently none lol (TODO, Linting. Shivers.)
