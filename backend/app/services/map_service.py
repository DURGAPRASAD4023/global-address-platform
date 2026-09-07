"""Map link service — never hard-code provider URLs in UI components."""

from __future__ import annotations

from urllib.parse import quote


class MapService:
    def links(
        self,
        latitude: float,
        longitude: float,
        *,
        label: str | None = None,
    ) -> dict[str, str]:
        q = f"{latitude},{longitude}"
        encoded_label = quote(label or q)
        return {
            "openstreetmap": f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}#map=18/{latitude}/{longitude}",
            "google_maps": f"https://www.google.com/maps/search/?api=1&query={q}",
            "apple_maps": f"https://maps.apple.com/?ll={q}&q={encoded_label}",
            "navigate_google": f"https://www.google.com/maps/dir/?api=1&destination={q}",
            "navigate_apple": f"https://maps.apple.com/?daddr={q}&dirflg=d",
        }

    def coordinates_text(self, latitude: float, longitude: float) -> str:
        return f"{latitude}, {longitude}"
