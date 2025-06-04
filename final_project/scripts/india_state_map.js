
// india_state_map.js with dropdown filters for year and cause + reset button (styled + fixed duplicate)

Promise.all([
    d3.json("https://code.highcharts.com/mapdata/countries/in/in-all.geo.json"),
    d3.csv("Internet_Shutdown_2016_2026.csv")
]).then(([geojson, data]) => {

    const geoStates = geojson.features.map(f => f.properties.name);
    const indiaDataRaw = data.filter(d => d.country.trim().toUpperCase() === "INDIA");

    const yearDropdown = document.getElementById("yearDropdown");
    const causeDropdown = document.getElementById("causeDropdown");
    const resetButton = document.getElementById("resetFilters");

    // Clear any existing options (prevent duplicates)
    yearDropdown.innerHTML = "";
    causeDropdown.innerHTML = "";

    // Add default "All" options
    const allYearOption = document.createElement("option");
    allYearOption.value = "all";
    allYearOption.text = "All Years";
    yearDropdown.add(allYearOption);

    const allCauseOption = document.createElement("option");
    allCauseOption.value = "all";
    allCauseOption.text = "All Causes";
    causeDropdown.add(allCauseOption);

    // Populate dropdowns
    const yearSet = new Set();
    const causeSet = new Set();
    indiaDataRaw.forEach(d => {
        const year = new Date(d.start_date).getFullYear();
        yearSet.add(year);
        causeSet.add(d.actual_cause.trim());
    });

    [...yearSet].sort().forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.text = year;
        yearDropdown.add(option);
    });

    [...causeSet].sort().forEach(cause => {
        const option = document.createElement("option");
        option.value = cause;
        option.text = cause;
        causeDropdown.add(option);
    });

    // Set default to All
    yearDropdown.value = "all";
    causeDropdown.value = "all";

    yearDropdown.addEventListener("change", updateMap);
    causeDropdown.addEventListener("change", updateMap);
    resetButton.addEventListener("click", () => {
        yearDropdown.value = "all";
        causeDropdown.value = "all";
        updateMap();
    });

    function matchState(area) {
        const areaUpper = (area || "").toUpperCase();
        const stateMatch = geoStates.find(state => areaUpper.includes(state.toUpperCase()));
        return stateMatch || null;
    }

    function updateMap() {
        const selectedYear = yearDropdown.value;
        const selectedCause = causeDropdown.value;

        const filteredData = indiaDataRaw.filter(d => {
            const year = new Date(d.start_date).getFullYear().toString();
            const cause = d.actual_cause.trim();
            const yearMatch = (selectedYear === "all" || year === selectedYear);
            const causeMatch = (selectedCause === "all" || cause === selectedCause);
            return yearMatch && causeMatch;
        });

        const stateCounts = {};
        filteredData.forEach(d => {
            const area = d.area_name || "";
            const matchedState = matchState(area);
            if (matchedState) {
                stateCounts[matchedState] = (stateCounts[matchedState] || 0) + 1;
            }
        });

        const processedData = geojson.features.map(feature => {
            const stateName = feature.properties.name;
            return {
                'hc-key': feature.properties['hc-key'],
                value: stateCounts[stateName] || null
            };
        });

        Highcharts.mapChart('india-state-map-container', {
            chart: {
                map: geojson,
                backgroundColor: '#000000'
            },
            title: { text: '' },
            mapNavigation: { enabled: false },
            colorAxis: {
                min: 0,
                max: Math.max(...Object.values(stateCounts), 10),
                minColor: '#FFFFFF',
                maxColor: '#E80734'
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderColor: '#E80734',
                style: { color: '#000000' },
                formatter: function () {
                    return `<strong>${this.point.name}</strong><br>Shutdowns: <b>${this.point.value !== null ? this.point.value : 0}</b>`;
                }
            },
            series: [{
                data: processedData,
                name: 'Shutdowns',
                nullColor: '#222222',
                states: {
                    hover: { color: '#FF6666' }
                },
                dataLabels: { enabled: false }
            }]
        });
    }

    // Initialize map with all data
    updateMap();

}).catch(error => console.error("Map Load Error:", error));
