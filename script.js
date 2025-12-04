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
    { name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    { name: 'Berlin', timezone: 'Europe/Berlin' },
    { name: 'Moscow', timezone: 'Europe/Moscow' },
    { name: 'Singapore', timezone: 'Asia/Singapore' }
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
    if (locationEl && locationEl.textContent === 'Detecting location...') {
        locationEl.textContent = locationName;
    }
}

function updateTime() {
    try {
        // Current atomic time
        const now = new Date(Date.now() + timeOffset);

        // Check if we are on index page
        const timeEl = document.getElementById('time');
        if (timeEl) {
            // 1. Update Main Clock
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timeString = `${hours}:${minutes}:${seconds}`;

            timeEl.textContent = timeString;

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

        // Check if we are on compare page
        if (document.getElementById('city1')) {
            updateComparePage(now);
        }

        // Check if we are on timezones page
        if (document.getElementById('timezone-table-body')) {
            updateTimezonesPage(now);
        }
    } catch (error) {
        console.error("Error in updateTime:", error);
    }
}

function updateCities(baseTime) {
    const grid = document.getElementById('cities-grid');
    if (!grid) return;

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
            const cityTimeOpts = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: city.timezone
            };
            const cityDateOpts = {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                timeZone: city.timezone
            };

            const timeStr = baseTime.toLocaleString('en-US', cityTimeOpts);
            const dateStr = baseTime.toLocaleString('en-US', cityDateOpts);

            card.querySelector('.city-time').textContent = timeStr;
            card.querySelector('.city-date').textContent = dateStr;
        }
    });
}

// Compare Page Logic
function initComparePage() {
    const sel1 = document.getElementById('city1');
    const sel2 = document.getElementById('city2');

    if (!sel1 || !sel2) return;

    cities.forEach((city, index) => {
        const opt1 = document.createElement('option');
        opt1.value = city.timezone;
        opt1.textContent = city.name;
        sel1.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = city.timezone;
        opt2.textContent = city.name;
        sel2.appendChild(opt2);
    });

    // Defaults
    if(cities.length > 0) sel1.value = cities[0].timezone;
    if(cities.length > 1) sel2.value = cities[1].timezone;

    // Add event listeners to update diff immediately
    sel1.addEventListener('change', () => updateComparePage(new Date(Date.now() + timeOffset)));
    sel2.addEventListener('change', () => updateComparePage(new Date(Date.now() + timeOffset)));
}

function updateComparePage(now) {
    const sel1 = document.getElementById('city1');
    const sel2 = document.getElementById('city2');

    if (!sel1 || !sel2) return;

    const tz1 = sel1.value;
    const tz2 = sel2.value;

    if (!tz1 || !tz2) return;

    const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: false };
    const dateOpts = { weekday: 'short', day: 'numeric', month: 'short' };

    const formatTime = (tz) => {
        return now.toLocaleString('en-US', { ...timeOpts, timeZone: tz });
    };

    const formatDate = (tz) => {
        return now.toLocaleString('en-US', { ...dateOpts, timeZone: tz });
    };

    const t1El = document.getElementById('time1');
    const d1El = document.getElementById('date1');
    const t2El = document.getElementById('time2');
    const d2El = document.getElementById('date2');

    t1El.textContent = formatTime(tz1);
    d1El.textContent = formatDate(tz1);

    t2El.textContent = formatTime(tz2);
    d2El.textContent = formatDate(tz2);

    // Calculate difference using simplified visual comparison
    // We treat the "face value" of the time in that zone as if it were UTC, to compare offsets.
    const getVisualDate = (tz) => {
         const opts = {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false,
            timeZone: tz
        };
        const str = now.toLocaleString('en-US', opts);
        return new Date(str);
    };

    const date1 = getVisualDate(tz1);
    const date2 = getVisualDate(tz2);

    // diff in ms
    const diffMs = date1 - date2;
    const diffMins = Math.round(diffMs / 60000);

    const diffEl = document.getElementById('diff-result');
    const city1Name = sel1.options[sel1.selectedIndex].text;
    const city2Name = sel2.options[sel2.selectedIndex].text;

    if (diffMins === 0) {
        diffEl.textContent = `${city1Name} and ${city2Name} are on the same time.`;
    } else {
        const absDiff = Math.abs(diffMins);
        const hours = Math.floor(absDiff / 60);
        const mins = absDiff % 60;
        let timeStr = "";
        if (hours > 0) timeStr += `${hours} hour${hours > 1 ? 's' : ''}`;
        if (mins > 0) timeStr += ` ${mins} minute${mins > 1 ? 's' : ''}`;

        const relation = diffMins > 0 ? "ahead of" : "behind";
        diffEl.textContent = `${city1Name} is ${timeStr.trim()} ${relation} ${city2Name}.`;
    }
}

// Timezones Page Logic
function updateTimezonesPage(now) {
    const tableBody = document.getElementById('timezone-table-body');
    if (!tableBody) return;

    // We only build it once
    if (tableBody.children.length === 0) {
        const zones = [
            { name: 'UTC', tz: 'UTC' },
            { name: 'London (GMT/BST)', tz: 'Europe/London' },
            { name: 'Central European Time (CET)', tz: 'Europe/Paris' },
            { name: 'Eastern Standard Time (EST)', tz: 'America/New_York' },
            { name: 'Pacific Standard Time (PST)', tz: 'America/Los_Angeles' },
            { name: 'Japan Standard Time (JST)', tz: 'Asia/Tokyo' },
            { name: 'Australian Eastern Time (AEST)', tz: 'Australia/Sydney' }
        ];

        zones.forEach(zone => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${zone.name}</td>
                <td id="tz-${zone.tz.replace(/\//g, '-')}" class="tz-time">--:--</td>
            `;
            tableBody.appendChild(row);
        });
    }

    const zones = [
        'UTC', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney'
    ];

    zones.forEach(tz => {
        const el = document.getElementById(`tz-${tz.replace(/\//g, '-')}`);
        if (el) {
            el.textContent = now.toLocaleString('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz
            });
        }
    });
}

// Calendar Page Logic
function initCalendarPage() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-month-year');
    if (!grid) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    title.textContent = `${monthNames[month]} ${year}`;

    // Days Header
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => {
        const div = document.createElement('div');
        div.className = 'calendar-day-header';
        div.textContent = d;
        grid.appendChild(div);
    });

    // Calendar days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        grid.appendChild(div);
    }

    // Days
    const today = new Date().getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = i;
        if (i === today) {
            div.classList.add('today');
        }
        grid.appendChild(div);
    }
}


// Initial sync
syncTime();
updateTime();
setInterval(updateTime, 250);

// Re-sync every 10 minutes
setInterval(syncTime, 600000);
