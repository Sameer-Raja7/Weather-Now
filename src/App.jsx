import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e && e.preventDefault();
    if (!query.trim()) return setError("Please enter a city name.");
    setError("");
    setWeather(null);
    setLocation(null);
    setLoading(true);

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=5&language=en&format=json`
      );
      if (!geoRes.ok) throw new Error(`Geocoding failed (${geoRes.status})`);
      const geoJson = await geoRes.json();
      if (!geoJson.results || geoJson.results.length === 0) {
        setError("No location found. Try a different city name.");
        setLoading(false);
        return;
      }

      const top = geoJson.results[0];
      const loc = {
        name: top.name,
        country: top.country,
        region: top.admin1 || "",
        lat: top.latitude,
        lon: top.longitude,
      };
      setLocation(loc);

      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation,windspeed_10m&timezone=auto`;
      const fRes = await fetch(forecastUrl);
      if (!fRes.ok) throw new Error(`Forecast failed (${fRes.status})`);
      const fJson = await fRes.json();
      setWeather(fJson);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function weatherCodeToEmoji(code) {
    if (code === 0) return "☀️ Clear";
    if (code === 1 || code === 2) return "🌤️ Partly cloudy";
    if (code === 3) return "☁️ Overcast";
    if (code >= 45 && code <= 48) return "🌫️ Fog";
    if (code >= 51 && code <= 67) return "🌦️ Drizzle / Rain";
    if (code >= 71 && code <= 77) return "❄️ Snow";
    if (code >= 80 && code <= 82) return "🌧️ Rain showers";
    if (code >= 85 && code <= 86) return "🌨️ Snow showers";
    if (code >= 95 && code <= 99) return "⛈️ Thunderstorm";
    return "🌈";
  }

  return (
    <div className="app-root">
      <div className="card" role="region" aria-label="Weather Now app">
        <header>
          <div className="sun">☀️</div>

          <div>
            <h1>Weather Now</h1>
            <div className="small">
              Quick current conditions anywhere — powered by Sameer
            </div>
          </div>
        </header>

        <form className="controls" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter city (e.g., HYD, Amalapuram, Kakinada)"
            aria-label="City name"
          />
          <button type="submit" disabled={loading} aria-disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <div className="meta">Tip: Enter a city name and hit Search.</div>
        <div className="grid">
          <div className="main">
            {!weather && !loading && (
              <div className="hint">
                No weather loaded yet. Try searching for a city above.
              </div>
            )}

            {weather && location && (
              <div>
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div className="small">
                      {location.name}
                      {location.region ? `, ${location.region}` : ""} —{" "}
                      {location.country}
                    </div>
                    <div className="big-temp">
                      {Math.round(weather.current_weather.temperature)}°C
                    </div>
                    <div className="small">
                      Feels like ≈{" "}
                      {Math.round(weather.current_weather.temperature)}°C • Wind{" "}
                      {Math.round(weather.current_weather.windspeed)} km/h
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20 }}>
                      {weatherCodeToEmoji(weather.current_weather.weathercode)}
                    </div>
                    <div className="small">
                      Updated: {weather.current_weather.time}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="small">
                    Latitude: {location.lat.toFixed(3)} • Longitude:{" "}
                    {location.lon.toFixed(3)}
                  </div>
                  <div className="small">Data: Open-Meteo</div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <h3 style={{ margin: "6px 0" }}>
                    Hourly snapshot (next 24 hrs)
                  </h3>
                  <div className="hourly">
                    {weather.hourly &&
                      weather.hourly.time &&
                      weather.hourly.time.slice(0, 24).map((t, idx) => (
                        <div key={t} className="hourly-box">
                          <div style={{ fontSize: 12 }}>
                            {new Date(t).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700 }}>
                            {Math.round(weather.hourly.temperature_2m[idx])}°
                          </div>
                          <div className="small">
                            Precip:{" "}
                            {weather.hourly.precipitation
                              ? weather.hourly.precipitation[idx]
                              : 0}{" "}
                            mm
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {loading && <div className="hint">Loading data…</div>}
          </div>

          <aside className="side">
            <div style={{ fontWeight: 700 }}>Quick details</div>
            <div className="small" style={{ marginTop: 8 }}>
              • Current weather code:{" "}
              {weather?.current_weather?.weathercode ?? "—"}
            </div>
            <div className="small" style={{ marginTop: 6 }}>
              • Timezone: {weather?.timezone ?? "—"}
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="small">Usage</div>
              <ul className="small" style={{ marginTop: 6 }}>
                <li>Type a city and press Enter or click Search.</li>
              </ul>
            </div>

            <div className="footer">
              <a href="/contact">Contact</a>
              <a
                className=""
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
              >
                API Source
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
