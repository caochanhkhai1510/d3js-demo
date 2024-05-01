d3.csv('data/Sleep_Efficiency.csv').then(data => {
    const parsedData = data.map(d => ({
        id: +d.ID,
        age: +d.Age,
        gender: d.Gender,
        sleepEfficiency: (+(d['Sleep efficiency'] * 100).toFixed(2)),
        remSleep: +d['REM sleep percentage'],
        deepSleep: +d['Deep sleep percentage'],
        lightSleep: +d['Light sleep percentage'],
        caffeineConsumption: +d['Caffeine consumption'] || 0,
        alcoholConsumption: +d['Alcohol consumption'] || 0,
        smokingStatus: d['Smoking status'] === 'Yes',
        exerciseFrequency: +d['Exercise frequency'] || 0
    }));

    createScatterPlot(parsedData);
    // createBarChart(parsedData, 'gender');
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
