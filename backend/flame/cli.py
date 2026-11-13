import argparse
import json
from .config import settings
from .store import Store
from .ingest import ingest

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='FLAME local corpus indexing; no paid calls unless explicitly enabled')
    parser.add_argument('command', choices=['ingest', 'inventory'])
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--embeddings', action='store_true')
    parser.add_argument('--force-embeddings', action='store_true')
    args = parser.parse_args()
    store = Store(settings())
    if args.command == 'ingest':
        print(ingest(store, args.dry_run, args.embeddings, args.force_embeddings).model_dump_json(indent=2))
    else:
        from .inventory import write_inventory
        write_inventory(store)
