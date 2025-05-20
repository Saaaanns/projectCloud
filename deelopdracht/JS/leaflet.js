"use strict";

var map = L.map("map").setView([51.229970826097734, 4.416077960165187], 5);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.marker([51.229970826097734, 4.416077960165187]).addTo(map);
L.marker([52.32740837726702, 4.930317237203161]).addTo(map);
