from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Dict, Any
import os

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db_name: str = "financial_ai"
    
    @classmethod
    async def connect_to_mongo(cls):
        """Connect to MongoDB"""
        # Default to localhost MongoDB if no connection string is provided
        mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        cls.client = AsyncIOMotorClient(mongo_url)
        
        # Test the connection
        try:
            # Send a ping to confirm a successful connection
            await cls.client.admin.command('ping')
            print("MongoDB connection established")
        except Exception as e:
            print(f"Unable to connect to MongoDB: {e}")
            
            # Use in-memory fallback by setting client to None
            # This will make get_db return a mock database
            cls.client = None
    
    @classmethod
    async def close_mongo_connection(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed")
    
    @classmethod
    def get_db(cls):
        """Get database object"""
        if cls.client:
            return cls.client[cls.db_name]
        else:
            # If no client is available, we're in in-memory mode
            # Return a mock database (it will be handled by the collections)
            return None
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a collection from the database"""
        db = cls.get_db()
        
        if db:
            return db[collection_name]
        else:
            # Return an in-memory collection proxy
            # This uses a module-level dictionary to simulate collections
            return InMemoryCollection(collection_name)

# In-memory database implementation for testing and development
_in_memory_db: Dict[str, Dict[str, Any]] = {
    "users": {},
    "financial_data": {},
    "chat_messages": {}
}

class InMemoryCollection:
    """A simple in-memory collection that mimics MongoDB's API"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        if collection_name not in _in_memory_db:
            _in_memory_db[collection_name] = {}
    
    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single document"""
        collection = _in_memory_db[self.collection_name]
        
        for doc_id, doc in collection.items():
            matches = True
            for key, value in query.items():
                if key == "_id" and isinstance(value, str):
                    # Handle ObjectId strings in queries
                    if doc_id != value:
                        matches = False
                        break
                elif key not in doc or doc[key] != value:
                    matches = False
                    break
            
            if matches:
                result = doc.copy()
                result["_id"] = doc_id
                return result
        
        return None
    
    def find(self, query: Dict[str, Any] = None):
        """Find documents matching a query"""
        return InMemoryCursor(self.collection_name, query or {})
    
    async def insert_one(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a document"""
        collection = _in_memory_db[self.collection_name]
        
        # Get the document ID
        doc_id = document.get("_id") or document.get("id")
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
        
        # Make a copy of the document
        doc = document.copy()
        
        # Remove the ID from the document
        if "_id" in doc:
            doc.pop("_id")
        if "id" in doc:
            doc.pop("id")
        
        # Store the document
        collection[doc_id] = doc
        
        return {"inserted_id": doc_id}
    
    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> Dict[str, Any]:
        """Update a document"""
        collection = _in_memory_db[self.collection_name]
        
        for doc_id, doc in collection.items():
            matches = True
            for key, value in query.items():
                if key == "_id" and isinstance(value, str):
                    # Handle ObjectId strings in queries
                    if doc_id != value:
                        matches = False
                        break
                elif key not in doc or doc[key] != value:
                    matches = False
                    break
            
            if matches:
                if "$set" in update:
                    for key, value in update["$set"].items():
                        doc[key] = value
                
                return {"modified_count": 1}
        
        return {"modified_count": 0}
    
    async def delete_one(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a document"""
        collection = _in_memory_db[self.collection_name]
        
        for doc_id, doc in collection.items():
            matches = True
            for key, value in query.items():
                if key == "_id" and isinstance(value, str):
                    # Handle ObjectId strings in queries
                    if doc_id != value:
                        matches = False
                        break
                elif key not in doc or doc[key] != value:
                    matches = False
                    break
            
            if matches:
                del collection[doc_id]
                return {"deleted_count": 1}
        
        return {"deleted_count": 0}

class InMemoryCursor:
    """A cursor for the in-memory collection"""
    
    def __init__(self, collection_name: str, query: Dict[str, Any]):
        self.collection_name = collection_name
        self.query = query
        self.collection = _in_memory_db[collection_name]
        self.sort_key = None
        self.sort_direction = 1
        self.limit_value = None
    
    def sort(self, key: str, direction: int = 1):
        """Sort the results"""
        self.sort_key = key
        self.sort_direction = direction
        return self
    
    def limit(self, n: int):
        """Limit the number of results"""
        self.limit_value = n
        return self
    
    async def to_list(self, length: int = None) -> list:
        """Convert to a list"""
        results = []
        
        for doc_id, doc in self.collection.items():
            matches = True
            for key, value in self.query.items():
                if key == "_id" and isinstance(value, str):
                    # Handle ObjectId strings in queries
                    if doc_id != value:
                        matches = False
                        break
                elif key not in doc or doc[key] != value:
                    matches = False
                    break
            
            if matches:
                result = doc.copy()
                result["_id"] = doc_id
                results.append(result)
        
        # Sort if needed
        if self.sort_key:
            results.sort(
                key=lambda x: x.get(self.sort_key, 0), 
                reverse=self.sort_direction == -1
            )
        
        # Apply limit
        if self.limit_value:
            results = results[:self.limit_value]
        
        # Apply length limit
        if length:
            results = results[:length]
        
        return results
    
    def __aiter__(self):
        self.current_index = 0
        self.items = []
        
        for doc_id, doc in self.collection.items():
            matches = True
            for key, value in self.query.items():
                if key == "_id" and isinstance(value, str):
                    # Handle ObjectId strings in queries
                    if doc_id != value:
                        matches = False
                        break
                elif key not in doc or doc[key] != value:
                    matches = False
                    break
            
            if matches:
                result = doc.copy()
                result["_id"] = doc_id
                self.items.append(result)
        
        # Sort if needed
        if self.sort_key:
            self.items.sort(
                key=lambda x: x.get(self.sort_key, 0), 
                reverse=self.sort_direction == -1
            )
        
        # Apply limit
        if self.limit_value:
            self.items = self.items[:self.limit_value]
        
        return self
    
    async def __anext__(self):
        if self.current_index >= len(self.items):
            raise StopAsyncIteration
        
        result = self.items[self.current_index]
        self.current_index += 1
        return result