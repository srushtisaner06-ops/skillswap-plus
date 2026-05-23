# MongoDB Transactions Setup

ASEP booking escrow uses Mongoose sessions and MongoDB multi-document transactions.
Transactions require MongoDB Atlas, mongos, or a replica set. A standalone local
MongoDB process will make the backend refuse to start.

## Recommended: MongoDB Atlas M0

1. Create a free M0 cluster in MongoDB Atlas.
2. Create a database user.
3. Allow your IP address in Network Access.
   - For local development, add your current IP address.
   - For quick hackathon testing only, you can temporarily allow `0.0.0.0/0`.
     Remove broad access before production.
4. Copy the Node.js connection string.
5. Set `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillswap?retryWrites=true&w=majority&appName=ASEP
REQUIRE_TRANSACTION_DB=true
```

6. Start the backend:

```powershell
cd server
npm start
```

## Local Single-Node Replica Set

Stop the current standalone MongoDB process first. Then start MongoDB with a
replica set name:

```powershell
New-Item -ItemType Directory -Force C:\data\asep-rs0
mongod --dbpath C:\data\asep-rs0 --replSet rs0 --bind_ip localhost --port 27017
```

In a second terminal, initialize the replica set once:

```powershell
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

Then set `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/skillswap?replicaSet=rs0
REQUIRE_TRANSACTION_DB=true
```

Restart the backend after changing `.env`.

## Why This Is Required

Booking creation deducts learner credits and creates a booking in one atomic
operation. Completion releases escrow credits to the mentor. Cancel and reject
refund the learner. Without transactions, any server crash or database error
could leave partial writes, negative credit states, or duplicate payouts.
