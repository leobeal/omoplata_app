# Members Map

The dashboard can show where members live on a Google map. Each marker represents all members sharing a set of coordinates and displays the total count.

Latitude and longitude are stored in dedicated columns of each address. They are populated by calling the Google Maps Geocoding API when an address is created.

Include the map on the dashboard with:

```blade
<livewire:app.dashboard.members-map />
```
