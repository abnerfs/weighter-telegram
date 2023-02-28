import { Collection, MongoClient } from "mongodb";
import { Weight } from "./models";

const { MONGO_URL, MONGO_DATABASE } = process.env;
if (!MONGO_URL || !MONGO_DATABASE)
    throw new Error("Invalid MONGO_URL or MONGO_DATABASE");


const client = new MongoClient(MONGO_URL, { maxPoolSize: 10 });
(async () => {
    await client.connect();
})();


const withConnection = <T>(cb: (_: Collection<Weight>) => T) => {
    const db = client.db(MONGO_DATABASE);
    const coll: Collection<Weight> = db.collection('weights');
    return cb(coll);
}

const upsertWeight = async (weight: Weight): Promise<void> => {
    await withConnection(async (coll: Collection<Weight>) => {
        await coll.findOneAndReplace(
            {
                "userId": weight.userId,
                "date": weight.date
            },
            weight,
            { upsert: true }
        );
    });
}

const listWeights = (userId: string) =>
    withConnection<Promise<Weight[]>>(async (coll) => await coll.find({ "userId": userId }).sort({ "date": "desc" }).limit(10).toArray());

const latestWeight = (userId: string, date: number): Promise<Weight | undefined> =>
    withConnection((coll: Collection<Weight>) =>
        coll.find({ "userId": userId, "date": { "$lt": date } })
            .sort({ "date": "desc" })
            .limit(1)
            .toArray()
            .then(x => x[0]))


export const weightDatabase = {
    upsertWeight,
    listWeights,
    latestWeight
};

