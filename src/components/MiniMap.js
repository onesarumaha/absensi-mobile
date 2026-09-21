import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * MiniMap — Peta interaktif dengan OpenStreetMap + Leaflet
 * Gratis, tanpa API key, jalan di Expo Go
 *
 * @param {number} latitude - Garis lintang
 * @param {number} longitude - Garis bujur
 * @param {string} title - Label lokasi
 * @param {number} height - Tinggi peta (default 200)
 */
export default function MiniMap({
  latitude,
  longitude,
  title = 'Lokasi Absen',
  height = 200,
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #e2e8f0;
    }
    .leaflet-control-attribution { display: none !important; }
    .marker-pin {
      width: 34px;
      height: 34px;
      background: #2563eb;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    }
    .marker-pin::after {
      content: '';
      width: 10px;
      height: 10px;
      background: #ffffff;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .marker-pulse {
      position: absolute;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.25);
      animation: pulse 1.8s infinite;
      top: -13px;
      left: -13px;
    }
    @keyframes pulse {
      0%   { transform: scale(0.7); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    .label-box {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      background: rgba(37, 99, 235, 0.92);
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 10px;
      font-family: -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="label-box">📍 ${title}</div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
    }).setView([${latitude}, ${longitude}], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: '',
      html: '<div class="marker-pulse"></div><div class="marker-pin"></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    L.marker([${latitude}, ${longitude}], { icon: markerIcon }).addTo(map);
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.wrapper, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});