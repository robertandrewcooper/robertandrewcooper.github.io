// circle_packing.js

d3.csv("Internet_Shutdown_2016_2026.csv").then(data => {
    const width = 1000, height = 900;

    const svg = d3.select("#circle-pack-container")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Filter data + exclude specific shutdowns
    const excluded = new Set([
        "LIBYA_8/8/2022",
        "INDIA_7/7/2021",
        "LIBYA_7/4/2022",
        "MYANMAR_10/20/2024",
        "INDIA_2/3/20189",
        "IRAN_11/2/2023",
        "INDIA_2/3/2019",
        "MYANMAR_12/3/2024"
    ]);

    const shutdowns = data.map(d => ({
        ...d,
        country: d.country.trim().toUpperCase(),
        cause: d.actual_cause.trim(),
        date: d.start_date.trim()
    })).filter(d => {
        const key = `${d.country}_${d.date}`;
        return d.cause && d.cause !== "" && d.cause !== "NA" && !excluded.has(key);
    });

    const uniqueCauses = Array.from(new Set(shutdowns.map(d => d.cause)));

    const palette = ["#FFFFFF", "#CCCCCC", "#888888", "#444444", "#FF6666", "#00CFFF"];
    const causeColor = d3.scaleOrdinal()
        .domain(uniqueCauses)
        .range(palette);

    const tooltip = d3.select("#circle-tooltip");

    const root = d3.hierarchy({ children: shutdowns }).sum(() => 1);
    const pack = d3.pack().size([width, height]).padding(2);
    const nodes = pack(root).leaves();

    const circles = svg.selectAll("circle.dot")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .attr("fill", "#E80734")
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`<strong>Country:</strong> ${d.data.country}<br>
                       <strong>Date:</strong> ${d.data.date}<br>
                       <strong>Cause:</strong> ${d.data.cause}`);
            gsap.to(this, { scale: 2, transformOrigin: "center", duration: 0.3 });
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY + 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            gsap.to(this, { scale: 1, transformOrigin: "center", duration: 0.3 });
        });

    circles.each(function(d) {
        d.nodeElement = this;
    });

    const numCols = 3;
    const colWidth = width / numCols;
    const rowHeight = 400;
    const causeCenters = {};
    uniqueCauses.forEach((cause, i) => {
        const col = i % numCols;
        const row = Math.floor(i / numCols);
        causeCenters[cause] = {
            x: colWidth / 2 + col * colWidth,
            y: rowHeight / 2 + row * rowHeight + 100
        };
    });

    const cachedPackedPositions = new Map();
    const usedDataPoints = new Set();

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
        trigger: "#circle-pack-section",
        start: "top top",
        end: "+=2500",
        pin: true,
        scrub: true,
        onUpdate: self => {
            const progress = self.progress;

            if (progress > 0.5) {
                circles.each(function(d) {
                    const color = causeColor(d.data.cause);
                    gsap.to(this, { fill: color, duration: 0.5, overwrite: true });
                });

                const grouped = d3.group(shutdowns, d => d.cause);

                grouped.forEach((groupData, cause) => {
                    const center = causeCenters[cause];

                    if (!cachedPackedPositions.has(cause)) {
                        const rootCause = d3.hierarchy({ children: groupData }).sum(() => 1);
                        const groupPack = d3.pack().size([180, 180]).padding(2);
                        const packedNodes = groupPack(rootCause).leaves();
                        cachedPackedPositions.set(cause, packedNodes);
                    }

                    const packedNodes = cachedPackedPositions.get(cause);

                    packedNodes.forEach((pn) => {
                        const matching = nodes.find(d => d.data === pn.data);
                        if (matching) {
                            usedDataPoints.add(matching);

                            gsap.to(matching.nodeElement, {
                                attr: {
                                    cx: center.x + pn.x - 90,
                                    cy: center.y + pn.y - 90
                                },
                                duration: 1,
                                ease: "power2.out"
                            });
                        }
                    });

                    // Draw enclosing circle
                    svg.selectAll(`.circle-outline-${cause.replace(/\s+/g, "-")}`)
                        .data([cause])
                        .join("circle")
                        .attr("class", `circle-outline-${cause.replace(/\s+/g, "-")}`)
                        .attr("cx", center.x)
                        .attr("cy", center.y)
                        .attr("r", 95)
                        .attr("fill", "none")
                        .attr("stroke", causeColor(cause))
                        .attr("stroke-width", 1)
                        .attr("opacity", 0.2);

                    // Add cause label
                    svg.selectAll(`.label-${cause.replace(/\s+/g, "-")}`).data([cause])
                        .join("text")
                        .attr("class", `label-${cause.replace(/\s+/g, "-")}`)
                        .attr("x", center.x)
                        .attr("y", center.y - 110)
                        .attr("text-anchor", "middle")
                        .attr("fill", causeColor(cause))
                        .attr("font-size", 16)
                        .style("opacity", 1)
                        .text(cause);
                });

                nodes.forEach(d => {
                    if (!usedDataPoints.has(d)) {
                        d3.select(d.nodeElement).attr("display", "none");
                    }
                });

            } else {
                circles.each(function(d) {
                    gsap.to(this, { fill: "#E80734", duration: 0.5, overwrite: true });
                    gsap.to(this, {
                        attr: { cx: d.x, cy: d.y },
                        duration: 1,
                        ease: "power2.out"
                    });
                    d3.select(this).attr("display", "inline");
                });

                svg.selectAll("text").transition().duration(800).style("opacity", 0);
                svg.selectAll("circle[class^='circle-outline']").remove();
            }
        }
    });

}).catch(error => console.error("Circle Packing Error:", error));
