import * as fs from 'fs';
import * as path from 'path';

type StoreData = {[key: string]: string};

type SafeStorageLike = {
    isEncryptionAvailable(): boolean
    encryptString(plainText: string): Buffer
    decryptString(encrypted: Buffer): string
};

type ElectronLike = {
    app: {getPath(name: 'userData'): string}
    safeStorage: SafeStorageLike
};

// ^ Replaces keytar: secrets are encrypted with the OS keychain via safeStorage and kept in a JSON file under userData.
// Passwords saved by older keytar-based builds are not migrated; users have to re-enter them once.
export class SecureStore {
    constructor(
        private storeName: string,
        private electron: ElectronLike
    ) {}

    isAvailable(): boolean {
        return this.electron.safeStorage.isEncryptionAvailable();
    }

    private getStorePath(): string {
        const storeDir = path.join(this.electron.app.getPath('userData'), 'data');
        fs.mkdirSync(storeDir, {recursive: true});
        return path.join(storeDir, `${this.storeName}.json`);
    }

    private getKey(domain: string, account: string): string {
        return `${this.storeName}__${domain}__${account}`.replace(/[^a-zA-Z0-9_]/g, '__');
    }

    private readStore(): StoreData {
        const storePath = this.getStorePath();
        if(!fs.existsSync(storePath)) return {};
        try {
            return <StoreData>JSON.parse(fs.readFileSync(storePath, 'utf8'));
        } catch {
            return {};
        }
    }

    private writeStore(data: StoreData): void {
        fs.writeFileSync(this.getStorePath(), JSON.stringify(data), {mode: 0o600});
    }

    /** Returns false when the OS provides no encryption, in which case nothing is stored. */
    async setPassword(domain: string, account: string, password: string): Promise<boolean> {
        if(!this.isAvailable()) return false;
        const store = this.readStore();
        store[this.getKey(domain, account)] = this.electron.safeStorage.encryptString(password).toString('base64');
        this.writeStore(store);
        return true;
    }

    async deletePassword(domain: string, account: string): Promise<void> {
        const store = this.readStore();
        const key = this.getKey(domain, account);
        if(!(key in store)) return;
        delete store[key];
        this.writeStore(store);
    }

    async getPassword(domain: string, account: string): Promise<string | null> {
        if(!this.isAvailable()) return null;
        const encrypted = this.readStore()[this.getKey(domain, account)];
        if(encrypted === undefined) return null;
        try {
            return this.electron.safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
        } catch {
            return null;
        }
    }
}
