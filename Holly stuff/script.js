// Global variable to store the last fetched crime data
let lastFetchedData = [];

window.onload = function() {
    // Initialize map
    var map = L.map('map').setView([51.5074, -0.1278], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    var marker;
    map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;

        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map);
    });
};

// Fetch crimes from Police API
async function getCrimes() {
    var date = document.getElementById('date').value;
    var lat = document.getElementById('latitude').value;
    var long = document.getElementById('longitude').value;

    if (!lat || !long || !date) {
        alert("Please select a location and a date first.");
        return;
    }

    try {
        const response = await fetch(`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${long}&date=${date}`);
        const data = await response.json();

        lastFetchedData = data; // store globally for instant filtering

        populateDropdown(data); // populate dropdown with categories
        renderResults(data);    // render initial results
    } catch (error) {
        console.error('Error fetching data:', error);
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = "<h2>All Crimes In This Area:</h2><p>Error fetching data.</p>";
    }
}

// Populate the crime type dropdown
function populateDropdown(data) {
    const select = document.getElementById('crimeType');
    const categories = [...new Set(data.map(crime => crime.category))];
    select.innerHTML = '<option value="">All</option>'; // reset

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.replace(/-/g, ' ');
        select.appendChild(option);
    });

    // Filter instantly when the user changes the dropdown
    select.onchange = function() {
        const selectedType = select.value;
        const filteredData = selectedType
            ? lastFetchedData.filter(crime => crime.category === selectedType)
            : lastFetchedData;
        renderResults(filteredData);
    };
}

// Render crime results
function renderResults(filteredData) {
    const header = document.querySelector('#results h2');
    header.textContent = `There Are ${filteredData.length} Crimes In This Area:`;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    resultsDiv.appendChild(header);

    if (filteredData.length === 0) {
        resultsDiv.innerHTML += "<p>No crimes found for this location, date, and filter.</p>";
    } else {
        resultsDiv.innerHTML += "<div>" +
            filteredData.map(crime =>
                `<div class="crime-result">${crime.category} at ${crime.location.street.name}</div>`
            ).join('') +
            "</div>";
    }

    // Trigger animation if using a slide-in effect
    resultsDiv.classList.remove('show');
    void resultsDiv.offsetWidth;
    resultsDiv.classList.add('show');
}
