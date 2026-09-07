/** Map link service — keep provider URLs out of UI components. */

export type MapLinks = {
  openstreetmap: string;
  google_maps: string;
  apple_maps: string;
  navigate_google: string;
  navigate_apple: string;
};

export function buildMapLinks(latitude: number, longitude: number, label?: string): MapLinks {
  const q = `${latitude},${longitude}`;
  const encoded = encodeURIComponent(label ?? q);
  return {
    openstreetmap: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`,
    google_maps: `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple_maps: `https://maps.apple.com/?ll=${q}&q=${encoded}`,
    navigate_google: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    navigate_apple: `https://maps.apple.com/?daddr=${q}&dirflg=d`,
  };
}

export function coordinatesText(latitude: number, longitude: number): string {
  return `${latitude}, ${longitude}`;
}
