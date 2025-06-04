// india_line_chart.js

d3.csv("Internet_Shutdown_2016_2026.csv").then(data => {
    const width = 1000, height = 700;
    const margin = { top: 60, right: 40, bottom: 60, left: 70 };

    const indiaData = data.map(d => ({
        country: d.country.trim().toUpperCase(),
        date: d.start_date.trim()
    })).filter(d => d.country === "INDIA");

    const yearCounts = d3.rollups(indiaData, v => v.length,
        d => new Date(d.date).getFullYear());

    const filteredYears = yearCounts.filter(([year]) => year >= 2016 && year <= 2024)
        .sort((a, b) => a[0] - b[0]);

    const years = filteredYears.map(d => d[0]);
    const counts = filteredYears.map(d => d[1]);

    const svg = d3.select("#india-line-chart-container")
        .append("svg")
        .attr("class", "line-chart-svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleLinear()
        .domain([2016, 2024])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(counts)]).nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(d[0]))
        .y(d => y(d[1]));

    // X Axis
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(9).tickFormat(d3.format("d")))
        .selectAll("text")
        .attr("fill", "white");

    // Y Axis
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(6))
        .selectAll("text")
        .attr("fill", "white");

    // Axis line/tick colors
    svg.selectAll(".domain").attr("stroke", "white");
    svg.selectAll(".tick line").attr("stroke", "white");

    // Line path
    svg.append("path")
        .datum(filteredYears)
        .attr("fill", "none")
        .attr("stroke", "#E80734")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Dots
    svg.selectAll("circle")
        .data(filteredYears)
        .enter()
        .append("circle")
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", 6)
        .attr("fill", "#E80734")
        .attr("stroke", "white")
        .attr("stroke-width", 1);

    // Count Labels
    svg.selectAll("text.count")
        .data(filteredYears)
        .enter()
        .append("text")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]) - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "14px")
        .text(d => d[1]);

    // X Axis Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 15)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "14px")
        .text("Year");

    // Y Axis Title
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "14px")
        .text("Number of Shutdowns");
}).catch(err => console.error("Error loading India line chart data:", err));
