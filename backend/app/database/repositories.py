from copy import deepcopy
from threading import Lock
from typing import Any


class InMemoryRepository:
    def __init__(self, seed: list[dict[str, Any]] | None = None):
        self._items = {item["id"]: deepcopy(item) for item in (seed or [])}
        self._lock = Lock()

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            return deepcopy(list(self._items.values()))

    def get(self, item_id: str) -> dict[str, Any] | None:
        with self._lock:
            item = self._items.get(item_id)
            return deepcopy(item) if item else None

    def create(self, item: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._items[item["id"]] = deepcopy(item)
            return deepcopy(item)

    def update(self, item_id: str, changes: dict[str, Any]) -> dict[str, Any] | None:
        with self._lock:
            if item_id not in self._items:
                return None
            self._items[item_id].update(changes)
            return deepcopy(self._items[item_id])

    def delete(self, item_id: str) -> bool:
        with self._lock:
            return self._items.pop(item_id, None) is not None
