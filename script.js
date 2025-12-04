let timeOffset = 0;
let isSynced = false;

// List of cities to display
const cities = [
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { name: 'Paris', timezone: 'Europe/Paris' },
    { name: 'Sydney', timezone: 'Australia/Sydney' },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles' },
    { name: 'Dubai', timezone: 'Asia/Dubai' },
    { name: 'Hong Kong', timezone: 'Asia/Hong_Kong' }
];

async function syncTime() {
    try {
        const start = Date.now();
        const response = await fetch('https://worldtimeapi.org/api/ip');
        const data = await response.json();
        const end = Date.now();

        // Calculate latency (approximate one-way trip)
        const latency = (end - start) / 2;

        // WorldTimeAPI returns datetime in ISO format which includes the offset info
        const serverDate = new Date(data.datetime);
        const serverTimeMs = serverDate.getTime();

        // Adjusted server time including latency
        const adjustedServerTime = serverTimeMs + latency;

        timeOffset = adjustedServerTime - end;
        isSynced = true;

        console.log(`Time synced. Offset: ${timeOffset}ms. Latency: ${latency}ms`);

        // Update location based on API if possible (it returns timezone)
        if (data.timezone) {
            updateLocationDisplay(data.timezone);
        }

    } catch (e) {
        console.error('Failed to sync time:', e);
        isSynced = false;
    }
}

function updateLocationDisplay(timezone) {
    let locationName = timezone;
    if (timezone.includes('/')) {
        locationName = timezone.split('/').pop();
    }
    locationName = locationName.replace(/_/g, ' ');
    const locationEl = document.getElementById('location');
    if (locationEl) {
        locationEl.textContent = locationName;
    }
}

function updateTime() {
    // Current atomic time
    const now = new Date(Date.now() + timeOffset);

    // 1. Update Main Clock
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    const timeEl = document.getElementById('time');
    if (timeEl) {
        timeEl.textContent = timeString;
    }

    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString(undefined, options);
    const dateEl = document.getElementById('date');
    if (dateEl) {
        dateEl.textContent = dateString;
    }

    // 2. Update Cities Grid
    updateCities(now);

    // Initial Location Fallback
    if (!isSynced && document.getElementById('location').textContent === 'Detecting location...') {
         try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            updateLocationDisplay(timezone);
        } catch (e) {
             document.getElementById('location').textContent = 'Local Time';
        }
    }
}

function updateCities(baseTime) {
    const grid = document.getElementById('cities-grid');
    if (!grid) return;

    // We clear and rebuild? No, efficient DOM updates are better.
    // But for simplicity and list stability, let's create the elements once if they don't exist.

    if (grid.children.length === 0) {
        cities.forEach(city => {
            const card = document.createElement('div');
            card.className = 'city-card';
            card.id = `city-${city.name.replace(/\s+/g, '-')}`;

            const infoDiv = document.createElement('div');
            const nameSpan = document.createElement('div');
            nameSpan.className = 'city-name';
            nameSpan.textContent = city.name;

            const dateSpan = document.createElement('small');
            dateSpan.className = 'city-date';

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(dateSpan);

            const timeSpan = document.createElement('div');
            timeSpan.className = 'city-time';

            card.appendChild(infoDiv);
            card.appendChild(timeSpan);
            grid.appendChild(card);
        });
    }

    // Update times
    cities.forEach(city => {
        const card = document.getElementById(`city-${city.name.replace(/\s+/g, '-')}`);
        if (card) {
            // Calculate time for this city
            // We can use toLocaleString with timeZone

            const cityTimeOpts = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit', // optional
                hour12: false,
                timeZone: city.timezone
            };
            const cityDateOpts = {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                timeZone: city.timezone
            };

            // baseTime is a Date object representing the atomic time.
            const timeStr = baseTime.toLocaleString('en-US', cityTimeOpts);
            const dateStr = baseTime.toLocaleString('en-US', cityDateOpts);

            card.querySelector('.city-time').textContent = timeStr;
            card.querySelector('.city-date').textContent = dateStr;
        }
    });
}

// Initial sync
syncTime();
updateTime();
setInterval(updateTime, 250);

// Re-sync every 10 minutes
setInterval(syncTime, 600000);
