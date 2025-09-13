import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const RepairShops = ({ shops, onSelectShop }) => {
  if (!shops || shops.length === 0) return <p>No repair shops found.</p>;

  // Determine map center
  const firstShop = shops[0];
  const center = firstShop.location?.coordinates
    ? [firstShop.location.coordinates[1], firstShop.location.coordinates[0]] // MongoDB format
    : firstShop.geometry?.location
      ? [firstShop.geometry.location.lat, firstShop.geometry.location.lng] // Google Places format
      : [0, 0]; // fallback

  return (
    <div style={{ height: 500, width: "100%" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {shops.map((shop) => {
          const position = shop.location?.coordinates
            ? [shop.location.coordinates[1], shop.location.coordinates[0]] // MongoDB
            : shop.geometry?.location
              ? [shop.geometry.location.lat, shop.geometry.location.lng] // Google Places
              : [0, 0];

          const key = shop._id || shop.place_id || Math.random();

          const handleClick = () => {
            if (onSelectShop) {
              onSelectShop(shop);
            }
          };

          return (
            <Marker
              key={key}
              position={position}
              eventHandlers={{ click: handleClick }}
            >
              <Tooltip>{shop.name}</Tooltip>
              <Popup>
                <strong>{shop.name}</strong>
                <br />
                {shop.address || shop.vicinity || "Address not available"}
                <br />
                {shop.rating
                  ? `Rating: ${shop.rating} (${shop.user_ratings_total ?? 0} reviews)`
                  : null}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RepairShops;
