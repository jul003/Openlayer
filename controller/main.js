import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import { fromLonLat, toLonLat } from 'https://cdn.skypack.dev/ol/proj.js';
import { Icon, Style } from 'https://cdn.skypack.dev/ol/style.js';

// Sumber data untuk marker
const markerSource = new VectorSource();

// Layer untuk marker
const markerLayer = new VectorLayer({
  source: markerSource
});

// Lokasi default jika geolokasi tidak tersedia
const defaultLocation = [107.9019822944495, -7.215907720160664];

// Inisialisasi peta
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),
    markerLayer
  ],
  view: new View({
    center: fromLonLat(defaultLocation),
    zoom: 12
  })
});

const savedLocations = [];
let currentCoordinate = null;

const popup = document.getElementById('input-popup');
const popupCoordinates = document.getElementById('popup-coordinates');
const descriptionInput = document.getElementById('location-description');
const saveButton = document.getElementById('save-location');
const cancelButton = document.getElementById('cancel-location');

// Elemen popup lokasi terdekat
const locationPopup = document.createElement('div');
locationPopup.id = 'location-popup';
locationPopup.className = 'popup hidden';
locationPopup.innerHTML = `
  <div class="popup-content">
    <h3>Lokasi Terdekat</h3>
    <p id="location-info"></p>
    <button id="close-location-popup">OK</button>
  </div>
`;
document.body.appendChild(locationPopup);

// Popup untuk menampilkan informasi marker
const markerInfoPopup = document.createElement('div');
markerInfoPopup.id = 'marker-info-popup';
markerInfoPopup.className = 'popup hidden';
markerInfoPopup.innerHTML = `
  <div class="popup-content">
    <h3>Informasi Lokasi</h3>
    <p id="marker-info-description"></p>
    <p id="marker-info-coordinates"></p>
    <p id="marker-info-region"></p>
    <button id="close-marker-info-popup">Tutup</button>
  </div>
`;
document.body.appendChild(markerInfoPopup);

// Fungsi untuk menambahkan marker
function addMarker(coordinate, description, iconUrl) {
  const marker = new Feature({
    geometry: new Point(coordinate),
  });

  marker.setProperties({ description });

  marker.setStyle(new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: iconUrl,
      scale: 0.08
    })
  }));

  markerSource.addFeature(marker);
}

// Fungsi untuk mendapatkan lokasi browser dan menampilkan popup
function setUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLocation = fromLonLat([
          position.coords.longitude,
          position.coords.latitude,
        ]);

        // Tambahkan marker gambar orang di lokasi pengguna
        addMarker(userLocation, 'Maneh didieu', 'https://cdn-icons-png.flaticon.com/512/1946/1946429.png');

        // Set view peta ke lokasi pengguna
        map.getView().setCenter(userLocation);
        map.getView().setZoom(14); // Zoom setelah menemukan lokasi pengguna

        // Tampilkan popup lokasi terdekat
        const lonLat = toLonLat(userLocation);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lonLat[1]}&lon=${lonLat[0]}`
          );
          const data = await response.json();
          const locationName = data?.display_name || `Longitude: ${lonLat[0]}, Latitude: ${lonLat[1]}`;
          showLocationPopup(locationName);
        } catch (error) {
          showLocationPopup(`Longitude: ${lonLat[0]}, Latitude: ${lonLat[1]}`);
        }
      },
      () => {
        // Jika gagal, gunakan lokasi default
        map.getView().setCenter(fromLonLat(defaultLocation));
        map.getView().setZoom(12);
        showLocationPopup('Gagal mendapatkan lokasi. Menampilkan lokasi default.');
      }
    );
  } else {
    // Jika browser tidak mendukung geolokasi
    map.getView().setCenter(fromLonLat(defaultLocation));
    map.getView().setZoom(12);
    showLocationPopup('Geolokasi tidak didukung oleh browser. Menampilkan lokasi default.');
  }
}

// Fungsi untuk menampilkan popup lokasi terdekat
function showLocationPopup(message) {
  const locationInfo = document.getElementById('location-info');
  locationInfo.textContent = message;

  const locationPopup = document.getElementById('location-popup');
  locationPopup.classList.remove('hidden');

  const closeButton = document.getElementById('close-location-popup');
  closeButton.addEventListener('click', () => {
    locationPopup.classList.add('hidden');
  });
}

// Fungsi untuk menampilkan popup informasi marker
function showMarkerInfo(description, coordinates, region) {
  const descriptionElement = document.getElementById('marker-info-description');
  const coordinatesElement = document.getElementById('marker-info-coordinates');
  const regionElement = document.getElementById('marker-info-region');

  descriptionElement.textContent = `Deskripsi: ${description}`;
  coordinatesElement.textContent = `Koordinat: Longitude ${coordinates[0].toFixed(6)}, Latitude ${coordinates[1].toFixed(6)}`;
  regionElement.textContent = `Nama Daerah: ${region}`;

  const markerInfoPopup = document.getElementById('marker-info-popup');
  markerInfoPopup.classList.remove('hidden');

  const closeButton = document.getElementById('close-marker-info-popup');
  closeButton.addEventListener('click', () => {
    markerInfoPopup.classList.add('hidden');
  });
}

// Panggil fungsi untuk menetapkan lokasi pengguna
setUserLocation();

// Menambahkan event listener untuk klik pada peta
map.on('click', async (event) => {
  const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);

  if (feature) {
    const props = feature.getProperties();
    const geometry = feature.getGeometry();
    const coordinates = toLonLat(geometry.getCoordinates());

    if (props.description) {
      // Gunakan API Geocoding untuk mendapatkan nama daerah
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates[1]}&lon=${coordinates[0]}`
        );
        const data = await response.json();
        const region = data?.display_name || 'Nama daerah tidak ditemukan';

        showMarkerInfo(props.description, coordinates, region);
      } catch (error) {
        showMarkerInfo(props.description, coordinates, 'Gagal mendapatkan nama daerah');
      }
    }
    return;
  }

  // Jika bukan marker, tampilkan informasi tempat biasa
  currentCoordinate = event.coordinate;
  const lonLat = toLonLat(currentCoordinate);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lonLat[1]}&lon=${lonLat[0]}`
    );
    const data = await response.json();

    if (data && data.display_name) {
      popupCoordinates.textContent = `You clicked on: ${data.display_name}`;
    } else {
      popupCoordinates.textContent = `Longitude: ${lonLat[0].toFixed(
        6
      )}, Latitude: ${lonLat[1].toFixed(6)}`;
    }
  } catch (error) {
    popupCoordinates.textContent = `Longitude: ${lonLat[0].toFixed(
      6
    )}, Latitude: ${lonLat[1].toFixed(6)}`;
  }

  popup.classList.remove('hidden');
});

// Simpan lokasi saat tombol "Save" diklik
saveButton.addEventListener('click', () => {
  const description = descriptionInput.value.trim();
  if (description && currentCoordinate) {
    const lonLat = toLonLat(currentCoordinate);

    savedLocations.push({ longitude: lonLat[0], latitude: lonLat[1], description });

    // Tambahkan marker baru
    addMarker(currentCoordinate, description, 'https://cdn-icons-png.flaticon.com/512/684/684908.png');

    updateLocationList();

    popup.classList.add('hidden');
    descriptionInput.value = '';
  }
});

// Tutup popup saat tombol "Cancel" diklik
cancelButton.addEventListener('click', () => {
  popup.classList.add('hidden');
  descriptionInput.value = '';
});

// Perbarui daftar lokasi di UI
function updateLocationList() {
  const locationList = document.getElementById('location-list');
  locationList.innerHTML = '';
  savedLocations.forEach((location, index) => {
    const li = document.createElement('li');
    li.textContent = `Location ${index + 1}: Longitude ${location.longitude}, Latitude ${location.latitude}, Description: ${location.description}`;
    locationList.appendChild(li);
  });
}
