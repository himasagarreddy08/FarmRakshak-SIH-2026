from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4


class NotificationService:
    """In-memory notification service for selected farm and partition context."""

    def __init__(self) -> None:
        self._notifications: Dict[str, Dict[str, Any]] = {}
        self._dedupe_keys: set = set()

    @staticmethod
    def _utc_now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_notification(
        self,
        farm_id: str,
        partition_id: str,
        notification_type: str,
        title: str,
        message: str,
        severity: str,
        source: str,
        action_url: Optional[str] = None,
        related_recommendation_id: Optional[str] = None,
        related_action_id: Optional[str] = None,
        data_status: str = "DEMO",
    ) -> Dict[str, Any]:
        dedupe_key = (str(farm_id), str(partition_id), str(notification_type), str(title), str(message))
        for notification in self._notifications.values():
            if (
                notification.get("farmId") == farm_id
                and notification.get("partitionId") == partition_id
                and notification.get("type") == notification_type
                and notification.get("title") == title
                and notification.get("message") == message
            ):
                return notification

        notification_id = str(uuid4())
        notification = {
            "id": notification_id,
            "farmId": farm_id,
            "partitionId": partition_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "severity": severity,
            "createdAt": self._utc_now(),
            "read": False,
            "source": source,
            "dataStatus": data_status,
        }
        if action_url is not None:
            notification["actionUrl"] = action_url
        if related_recommendation_id is not None:
            notification["relatedRecommendationId"] = related_recommendation_id
        if related_action_id is not None:
            notification["relatedActionId"] = related_action_id

        self._notifications[notification_id] = notification
        self._dedupe_keys.add(dedupe_key)
        return notification

    def list_notifications(self, farm_id: Optional[str] = None, partition_id: Optional[str] = None) -> List[Dict[str, Any]]:
        notifications = list(self._notifications.values())
        if farm_id is not None:
            notifications = [item for item in notifications if item.get("farmId") == farm_id]
        if partition_id is not None:
            notifications = [item for item in notifications if item.get("partitionId") == partition_id]
        return sorted(notifications, key=lambda item: item.get("createdAt", ""), reverse=True)

    def mark_read(self, notification_id: str) -> Dict[str, Any]:
        notification = self._notifications.get(notification_id)
        if notification is None:
            raise KeyError(f"Notification {notification_id} not found")
        notification["read"] = True
        return notification

    def unread_for_partition(self, farm_id: str, partition_id: str) -> List[Dict[str, Any]]:
        return [item for item in self.list_notifications(farm_id, partition_id) if not item.get("read", False)]
