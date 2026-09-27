"""
SRISHTI·AI - ChromaDB Vector Store Service
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False

from backend.database.db_service import db_service

class VectorStoreService:
    def __init__(self):
        self.collection = None
        self.doc_count = 0
        if HAS_CHROMADB:
            try:
                self.client = chromadb.Client(Settings(is_persistent=False))
                self.collection = self.client.get_or_create_collection(name="drilling_knowledge")
                self._initialize_data()
            except Exception as e:
                logger.error(f"Failed to initialize ChromaDB: {e}")
                self.collection = None
        else:
            logger.warning("chromadb not installed. Semantic search will return empty results.")

    def _initialize_data(self):
        if not self.collection:
            return
        
        events = db_service.get_events()
        documents = []
        metadatas = []
        ids = []

        for i, evt in enumerate(events):
            doc = f"Well {evt.get('well_id', '')} in {evt.get('formation', '')} at {evt.get('depth_md', '')}m: {evt.get('event_type', '')}. {evt.get('description', '')}. Mitigation: {evt.get('mitigation', '')}."
            documents.append(doc)
            metadatas.append({
                "type": "event",
                "well_id": evt.get("well_id", ""),
                "formation": evt.get("formation", ""),
                "event_type": evt.get("event_type", ""),
            })
            ids.append(f"evt_{evt.get('id', i)}")
        
        if documents:
            try:
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                self.doc_count = len(documents)
            except Exception as e:
                logger.error(f"Error adding documents to ChromaDB: {e}")

    def semantic_search(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        if not HAS_CHROMADB or not self.collection:
            logger.warning("ChromaDB not available for semantic search.")
            return []
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=min(n_results, self.doc_count) if self.doc_count > 0 else 1
            )
            
            search_results = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else []
                for i in range(len(docs)):
                    search_results.append({
                        "document": docs[i],
                        "metadata": metas[i] if i < len(metas) else {}
                    })
            return search_results
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []

    def get_collection_stats(self) -> Dict[str, Any]:
        if not HAS_CHROMADB or not self.collection:
            return {"count": 0, "collection_name": None, "status": "unavailable"}
        return {
            "count": self.doc_count,
            "collection_name": self.collection.name,
            "status": "active"
        }

vector_store = VectorStoreService()
