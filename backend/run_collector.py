from app.services.collector import CollectorService
from app.database import init_db

def run_manual_collect():
    init_db()
    collector = CollectorService()
    collector.collect_all()

if __name__ == "__main__":
    run_manual_collect()
