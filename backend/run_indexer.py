from app.database import engine, init_db
from app.services.indexer import IndexerService
from sqlmodel import Session

def run_sync():
    init_db()
    with Session(engine) as session:
        indexer = IndexerService(session)
        indexer.sync_tickers()

if __name__ == "__main__":
    run_sync()
