(function () {
  const imgW = 2500, imgH = 1892;
  // Use standard Simple CRS bounds: [southWest(lat,lng), northEast(lat,lng)]
  // where lat grows downward with Simple CRS usage.
  const bounds = L.latLngBounds([[0, 0], [imgH, imgW]]);
  const mapEl = document.getElementById('tarris-map');
  if (!mapEl) return;
  const isDark = () => document.documentElement.classList.contains('theme-dark');
  const pickSrc = () => isDark() ? '../assets/tarris-dark.png' : '../assets/tarris-light.png';

  const map = L.map(mapEl, {
    crs: L.CRS.Simple,
    zoomControl: true,
    attributionControl: false,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    dragging: true,
    zoomSnap: 0.1,
    wheelPxPerZoomLevel: 120,
    maxBoundsViscosity: 1.0
  });

  const image = L.imageOverlay(pickSrc(), bounds).addTo(map);

  // Fit once the image is loaded so Leaflet has the actual size.
  let didInitialFit = false;
  function fitAndConstrain() {
    // Ensure the container has non-trivial size before fitting.
    const w = mapEl.clientWidth, h = mapEl.clientHeight;
    if (!w || !h || w < 100 || h < 100) {
      map.invalidateSize();
      setTimeout(fitAndConstrain, 50);
      return;
    }

    // Allow fitBounds to choose any zoom by relaxing limits temporarily.
    map.setMaxBounds(null);
    map.setMinZoom(-10);
    map.setMaxZoom(20);

    map.invalidateSize();
    map.fitBounds(bounds, { animate: false });

    // Lock minimum to the fitted zoom so users can't zoom out past the image.
    const fitZoom = map.getZoom();
    map.setMinZoom(fitZoom);
    map.setMaxZoom(fitZoom + 2.5);
    map.setMaxBounds(bounds.pad(0.05));
    didInitialFit = true;
  }

  // Fit on readiness signals to avoid races.
  map.whenReady(fitAndConstrain);
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fitAndConstrain);
  setTimeout(fitAndConstrain, 100);

  // Refit when the image actually finishes loading (covers cached or async cases)
  if (image.getElement && image.getElement()) {
    const el = image.getElement();
    if (el.complete) fitAndConstrain();
    else el.addEventListener('load', fitAndConstrain, { once: true });
  } else if (image.once) {
    image.once('load', fitAndConstrain);
  }

  // Add a simple reset button
  const ResetButton = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const a = L.DomUtil.create('a', '', container);
      a.href = '#';
      a.role = 'button';
      a.title = 'Reset view';
      a.innerHTML = '&#8635;';
      L.DomEvent.on(a, 'click', (e) => {
        L.DomEvent.stop(e);
        fitAndConstrain();
      });
      return container;
    }
  });
  map.addControl(new ResetButton());

  // Swap map artwork on theme change
  function swapOnThemeChange() {
    const newUrl = pickSrc();
    if (image.setUrl) {
      let once = true;
      const onLoad = () => { if (once) { once = false; fitAndConstrain(); } };
      // Refit after the new image loads (in case of size/ratio differences)
      if (image.getElement && image.getElement()) {
        const el = image.getElement();
        el.addEventListener('load', onLoad, { once: true });
      } else if (image.once) {
        image.once('load', onLoad);
      }
      image.setUrl(newUrl);
    }
  }
  window.addEventListener('themechange', swapOnThemeChange);
})();
