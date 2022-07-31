import { Db, MongoClient } from 'mongodb'
import { Cache } from "./Cache";

const cache = new Cache(30000)
const defaultIP: string = 'localhost'
const defaultPort: number = 27017


export class Database {
    client: MongoClient
    connectionURL: string;
    database: string;
    db: (Db|null) = null

    constructor(database : string, username: string, password: string, ip?: string, port?: number) {
        if (username && password) this.connectionURL = `mongodb://${username}:${password}@${ip??defaultIP}:${port??defaultPort}`
        else this.connectionURL = `mongodb://${ip??defaultIP}:${port??defaultPort}`
        this.database = database;
        this.client = new MongoClient(this.connectionURL);
        this.connect()
    }

    connect() {
        this.client.connect().then(() => {
            this.db = this.client.db(this.database)
            console.log(`Connected to Database!`)
        })
        .catch(err => {
            console.error(`Failed to connect to database!`, err)
        })
    }

    reconnect() {
        this.client.close()
        this.connect()
    }

    disconnect() {
        this.client.close()
    }

    async read(table: string, id: string) : Promise<Object> {
        //let data = cache.get(id);
        //if (data !== null) return data;

        return await this.db.collection(table).findOne({_id: id});
    }

    async readAll(table: string) : Promise<Object[]> {
        return await (await this.db.collection(table).find()).toArray();
    }

    async containsDocument(table: string, id: string) {
        return (await this.db.collection(table).find({_id: id})) !== null
    }

    convert_IDToID(obj: any): any {
        if (obj?._id === undefined) return obj
        let id = obj["_id"]
        delete obj._id
        obj._id = id

        return obj
    }

    convertIDTo_ID(obj: any): any {
        if (obj?._id === undefined) return null
        let id = obj["id"]
        delete obj._id
        obj._id = id

        return obj
    }

    async insert(table: string, data: Object) : Promise<any> {
        //if (data?.["_id"] && this.containsDocument(table, data?.["_id"])) return this.db.collection(table).insertOne(data)
        return this.update(table, data?.["_id"], data)
    }

    async insertBulk(table: string, data: Array<any>): Promise<any> {
        return this.db.collection(table).insertMany(data)
    }

    async update(table: string, id: string, data: Object) : Promise<any> {
        let updateDoc = {$set: {}}
        for (let i in data) {if (i != '_id') updateDoc["$set"][i] = data[i]}
        return this.db.collection(table).updateOne({_id: id}, updateDoc, { upsert: true })
    }

    async delete(table: string, id: string) : Promise<any> {
        cache.remove(id);
        return this.db.collection(table).deleteOne({_id: id})
    }
}