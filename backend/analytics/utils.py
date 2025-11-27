from __future__ import annotations

ACTIVITY_ICON_MAP = {
    'login': '🔑',
    'logout': '🚪',
    'create': '➕',
    'update': '✏️',
    'delete': '🗑️',
    'view': '👁️',
}


def get_activity_icon(activity_type: str) -> str:
    """
    Return a unicode icon that represents the activity type.

    Parameters
    ----------
    activity_type: str
        The stored activity type choice value.
    """
    return ACTIVITY_ICON_MAP.get(activity_type, '📝')

