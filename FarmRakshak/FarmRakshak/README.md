# FarmRakshak

FarmRakshak is a mobile-first agricultural decision-support prototype for field guidance, crop scans, risk analysis, recommendations, weather, activities, and contextual farmer assistance.

## Run

From the project root:

```bash
pnpm install
PORT=3000 BASE_PATH=/ pnpm --dir FarmRakshak run dev
```

The app uses local demo data and browser storage. Live GPS, maps, weather, sensors, ML, QR camera, and speech providers can be connected later through the service boundaries in `src/App.tsx`.
