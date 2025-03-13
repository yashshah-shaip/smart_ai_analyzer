from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "finance_ai")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_to_mongo(cls):
        cls.client = AsyncIOMotorClient(MONGO_URI)
        print(f"Connected to MongoDB: {MONGO_URI}")
    
    @classmethod
    async def close_mongo_connection(cls):
        if cls.client:
            cls.client.close()
            print("Closed MongoDB connection")
    
    @classmethod
    def get_db(cls):
        if cls.client is None:
            raise Exception("Database client not initialized")
        return cls.client[DATABASE_NAME]
    
    @classmethod
    def get_collection(cls, collection_name: str):
        db = cls.get_db()
        return db[collection_name]