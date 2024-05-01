function binAges(data) {
    const binSize = 10; // You can adjust the bin size
    data.forEach(d => {
        d.ageBin = Math.floor(d.age / binSize) * binSize;
    });
    return data;
}

function aggregateData(data) {
    const ageBins = d3.group(data, d => d.ageBin);
    return Array.from(ageBins, ([ageBin, values]) => ({
        ageBin,
        sleepEfficiency: d3.mean(values, d => d.sleepEfficiency)
    }));
}


d3.csv('data/Sleep_Efficiency.csv').then(data => {
    const parsedData = data.map(d => ({
        id: +d.ID,
        age: +d.Age,
        gender: d.Gender,
        sleepEfficiency: parseFloat((d['Sleep efficiency'] * 100).toFixed(2)),
        remSleep: +d['REM sleep percentage'],
        deepSleep: +d['Deep sleep percentage'],
        lightSleep: +d['Light sleep percentage'],
        caffeineConsumption: +d['Caffeine consumption'] || 0,
        alcoholConsumption: +d['Alcohol consumption'] || 0,
        smokingStatus: d['Smoking status'] === 'Yes',
        exerciseFrequency: +d['Exercise frequency'] || 0
    }));
    createScatterPlot(parsedData);
    const binnedData = binAges(parsedData);
    const aggregatedData = aggregateData(binnedData);
    createBarChart(aggregatedData);
});

function createScatterPlot(data) {
    const width = 900
    const height = 600
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#scatter-plot')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid red') 
        .append('g')
        .attr('transform', `translate(${(width - innerWidth) / 2},${(height - innerHeight) / 2})`);

    const xScale = d3.scaleLinear()
        .domain([0, 70])
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(['Male', 'Female'])
        .range(['blue', 'pink', 'gray']);

    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale);

    svg.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text('Sleep Efficiency by Age and Gender');

    svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('y', 35)
        .attr('x', innerWidth)
        .attr('text-anchor', 'end')
        .attr('fill', 'black') // Ensure the text is black
        .text('Age (Years)');

    svg.append('g')
        .call(yAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('dy', '.71em')
        .attr('fill', 'black') // Ensure the text is black
        .text('Sleep Efficiency (%)');

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('display', 'none')
        .style('position', 'absolute')
        .style('padding', '10px')
        .style('background', 'white')
        .style('border', '1px solid black')
        .style('border-radius', '5px');

    svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.age))
    .attr('cy', d => yScale(d.sleepEfficiency))
    .attr('r', 3)  // Consider reducing radius if points are too large
    .attr('fill', d => colorScale(d.gender))
    .style('opacity', 0.8)  // Set opacity to allow for overlap visibility
    .on('mouseover', (event, d) => {
        tooltip.style('display', 'inline')
        .html(`Age: ${d.age}<br>Sleep Efficiency: ${parseFloat(d.sleepEfficiency.toFixed(2))}%<br>Gender: ${d.gender}`)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);
    })
    .on('mouseout', () => tooltip.style('display', 'none'));

    // Adding the legend
    const legend = svg.append('g')
        .attr('transform', `translate(10, 10)`);

    const legendItems = ['Male', 'Female'];

    legend.selectAll(null)
        .data(legendItems)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .each(function(d) {
            d3.select(this).append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', colorScale(d));
            d3.select(this).append('text')
                .attr('x', 18)
                .attr('y', 11)
                .text(d)
                .style('text-transform', 'capitalize')
                .style('font-size', '12px')
                .attr('text-anchor', 'start');
        });
}

function createBarChart(data) {
    const width = 900;
    const height = 600;
    const margin = { top: 50, right: 50, bottom: 100, left: 80 }; // Increased bottom margin for labels
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#bar-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid red')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.ageBin).sort((a, b) => a - b)) // Sort age bins in ascending order
        .range([0, innerWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.sleepEfficiency)])
        .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d => `${d} - ${d+9}`);
    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');
        

    svg.append('g')
        .call(yAxis);

    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.ageBin))
        .attr('y', d => yScale(d.sleepEfficiency))
        .attr('width', xScale.bandwidth())
        .attr('height', d => innerHeight - yScale(d.sleepEfficiency))
        .attr('fill', 'steelblue');

    // Adding a legend
    const legend = svg.append('g')
        .attr('transform', `translate(10, 0)`); // Position the legend in the upper right corner

    legend.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', 'steelblue');

    legend.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .text('Sleep Efficiency')
        .style('text-anchor', 'start');
}



