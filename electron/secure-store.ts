import * as fs from 'fs';
import * as path from 'path';

type StoreData = {[key: string]: string};

export class SecureStore {
    constructor(
        private storeName: string,
        private electronRemote: any
    ) {}

    private getStorePath(): string {
        const baseDir = this.electronRemote.app.getPath('userData');
        const storeDir = path.join(baseDir, 'data');
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
        const storePath = this.getStorePath();
        fs.writeFileSync(storePath, JSON.stringify(data));
    }

    async setPassword(domain: string, account: string, password: string): Promise<void> {
        if(this.electronRemote.safeStorage.isEncryptionAvailable() === false) return;
        const buffer = this.electronRemote.safeStorage.encryptString(password);
        const store = this.readStore();
        store[this.getKey(domain, account)] = buffer.toString('binary');
        this.writeStore(store);
    }

    async deletePassword(domain: string, account: string): Promise<void> {
        if(this.electronRemote.safeStorage.isEncryptionAvailable() === false) return;
        const store = this.readStore();
        delete store[this.getKey(domain, account)];
        this.writeStore(store);
    }

    async getPassword(domain: string, account: string): Promise<string | null> {
        if(this.electronRemote.safeStorage.isEncryptionAvailable() === false) return null;
        const store = this.readStore();
        const pw = store[this.getKey(domain, account)];
        if(!pw) return null;
        try {
            const buffer = Buffer.from(pw.toString(), 'binary');
            return this.electronRemote.safeStorage.decryptString(buffer);
        } catch {
            return null;
        }
    }
}
