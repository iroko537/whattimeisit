function updateTime() {
    const now = new Date();

    // Time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    document.getElementById('time').textContent = timeString;

    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString(undefined, options);
    document.getElementById('date').textContent = dateString;

    // Location (Timezone)
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Extract city from timezone (e.g., "America/New_York" -> "New York")
        let locationName = timezone;
        if (timezone.includes('/')) {
            locationName = timezone.split('/').pop();
        }
        locationName = locationName.replace(/_/g, ' ');

        // Use a more descriptive text
        document.getElementById('location').textContent = `Time in ${locationName}`;
    } catch (e) {
        document.getElementById('location').textContent = 'Local Time';
    }
}

// Update time immediately and then every second
updateTime();
setInterval(updateTime, 1000);
