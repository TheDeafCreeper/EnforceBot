import { v4 as uuid } from 'uuid';

export class Cache {
    data: Map<string, CacheData>;
    dataExperationTime: number;

    constructor(dataExperationTime: number) {
        this.dataExperationTime = dataExperationTime;
        this.data = new Map();

        setInterval(() => {
            this.data.forEach((data, id) => {
                if (data.updatedTime + this.dataExperationTime < Date.now() && dataExperationTime != -1) this.remove(id);
            })
        }, 60000)
    }

    save(id: string, data: any) {
        this.data.set(id, {
            data: data,
            updatedTime: Date.now()
        });
    }

    get(id: string): any {
        const data = this.data.get(id)

        if (data === undefined) return null;
        if (data.updatedTime + this.dataExperationTime < Date.now() && this.dataExperationTime != -1) this.remove(id)
        return this.data.get(id)?.data ?? null;
    }

    remove(id: string): boolean {
        return this.data.delete(id);
    }

    uuid(): string {
        return uuid();
    }
}

interface CacheData {
    data: any;
    updatedTime: number;
}