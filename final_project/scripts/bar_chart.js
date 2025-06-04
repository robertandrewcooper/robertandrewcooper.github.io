// bar_charts.js

d3.csv("Internet_Shutdown_2016_2026.csv").then(data => {
    const width = 600, height = 400;  // Bigger charts
    const margin = { top: 30, right: 10, bottom: 30, left: 30 };
    const causesToShow = ["Protests", "Information control", "Elections", "Political instability"];
    const causeIcons = {
        "Protests": "protest.svg",
        "Information control": "information control.png",
        "Elections": "vote.svg",
        "Political instability": "political instability.png"
    };    
    const years = d3.range(2016, 2025);

    // Preprocess + Filter data
    const filtered = data.map(d => ({
        year: new Date(d.start_date).getFullYear(),
        cause: d.actual_cause.trim()
    })).filter(d => years.includes(d.year) && causesToShow.includes(d.cause));

    // Group by cause then year
    const causeYearCounts = {};
    causesToShow.forEach(cause => {
        causeYearCounts[cause] = {};
        years.forEach(y => causeYearCounts[cause][y] = 0);
    });

    filtered.forEach(d => {
        causeYearCounts[d.cause][d.year]++;
    });

    causesToShow.forEach((cause, idx) => {
        const svg = d3.select("#bar-charts-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("margin", "20px");

        const counts = years.map(y => ({ year: y, count: causeYearCounts[cause][y] }));

        const x = d3.scaleBand()
            .domain(years)
            .range([margin.left, width - margin.right])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(counts, d => d.count)]).nice()
            .range([height - margin.bottom, margin.top]);

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSizeOuter(0))
            .attr("font-size", "10px")
            .attr("fill", "white");
            // Change x-axis text and line color to white
        svg.selectAll(".tick text").attr("fill", "white");
        svg.selectAll(".domain").attr("stroke", "white");  // Axis line
        svg.selectAll(".tick line").attr("stroke", "white");  // Tick marks


        // Bars
        svg.selectAll("rect")
            .data(counts)
            .enter()
            .append("rect")
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => y(0) - y(d.count))
            .attr("fill", "#E80734");

        // Count Text Above Bars
        svg.selectAll("text.count")
            .data(counts)
            .enter()
            .append("text")
            .attr("class", "count")
            .attr("x", d => x(d.year) + x.bandwidth() / 2)
            .attr("y", d => y(d.count) - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("fill", "white")
            .text(d => d.count);

        // Chart Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("fill", "#E80734")
            .text(cause);

        // Add icon image inside chart
        svg.append("image")
            .attr("href", causeIcons[cause])
            .attr("x", margin.left)
            .attr("y", margin.top - 20)
            .attr("width", 50)
            .attr("height", 50);

    });

}).catch(err => console.error("Error loading bar chart data:", err));
