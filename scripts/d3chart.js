function aggregateData(data) {
    const alcoholGroups = d3.group(data, d => d.alcoholConsumption);
    return Array.from(alcoholGroups, ([alcoholConsumption, values]) => ({
        alcoholConsumption,
        sleepEfficiency: d3.mean(values, d => d.sleepEfficiency),
        deepSleepPercentage: d3.mean(values, d => d.deepSleep)
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
    const aggregatedData = aggregateData(parsedData);
    createBarChart(aggregatedData);
});

function createScatterPlot(data) {
    // Group the data by age and gender
    const groupedData = d3.rollup(data, v => {
        return {
            sleepEfficiency: d3.mean(v, d => d.sleepEfficiency)
        };
    }, d => d.age, d => d.gender);

    // Convert the grouped data to an array of objects
    const scatterData = Array.from(groupedData, ([age, genderData]) => {
        return Array.from(genderData, ([gender, { sleepEfficiency }]) => ({
            age: +age,
            gender,
            sleepEfficiency
        }));
    }).flat();

    const width = 900
    const height = 750
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
    .data(scatterData)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.age))
    .attr('cy', d => yScale(d.sleepEfficiency))
    .attr('r', 5)  // Consider reducing radius if points are too large
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
    // Create a background rectangle for the legend
    legend.append('rect')
        .attr('x', -5)
        .attr('y', 0)
        .attr('width', 70) // Adjust the width as needed
        .attr('height', 50) // Adjust the height as needed
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('rx', 5) // Add rounded corners
        .attr('ry', 5);

    const legendItems = ['Male', 'Female'];

    legend.selectAll(null)
        .data(legendItems)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0, ${i * 20 + 10 })`)
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
    const height = 750;
    const margin = { top: 50, right: 50, bottom: 100, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#bar-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid red')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Convert alcohol consumption values to numbers
    const alcoholConsumptionValues = data.map(d => +d.alcoholConsumption);

    const xScale = d3.scaleBand()
        .domain(alcoholConsumptionValues.sort((a, b) => a - b)) // Sort the values numerically
        .range([0, innerWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text('Effect of alcohol consumption on sleep quality');

    // Add X axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .text('Alcohol Consumption (drinks)');

    // Add Y axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(innerHeight / 2))
        .attr('y', -margin.left + 20)
        .attr('text-anchor', 'middle')
        .text('Average Value (%)');

    svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', function(d) {
            return 'rotate(-65)' 
        });

    svg.append('g')
        .call(yAxis);
    // Add tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('display', 'none')
        .style('position', 'absolute')
        .style('padding', '10px')
        .style('background', 'white')
        .style('border', '1px solid black')
        .style('border-radius', '5px');

    // Add bars for sleep efficiency and deep sleep percentage
    svg.selectAll('.bar-sleep-efficiency')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar-sleep-efficiency')
        .attr('x', d => xScale(d.alcoholConsumption))
        .attr('y', d => yScale(d.sleepEfficiency))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => innerHeight - yScale(d.sleepEfficiency))
        .attr('fill', 'steelblue')
        .on('mouseover', function(event, d) {
            tooltip.style('display', 'inline')
                .html(`Alcohol Consumption: ${d.alcoholConsumption} drinks<br>Sleep Efficiency: ${d.sleepEfficiency.toFixed(2)}%`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function() {
            tooltip.style('display', 'none');
        });

    svg.selectAll('.bar-deep-sleep')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar-deep-sleep')
        .attr('x', d => xScale(d.alcoholConsumption) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.deepSleepPercentage))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => innerHeight - yScale(d.deepSleepPercentage))
        .attr('fill', 'darkgreen')
        .on('mouseover', function(event, d) {
            tooltip.style('display', 'inline')
                .html(`Alcohol Consumption: ${d.alcoholConsumption} drinks<br>Deep Sleep Percentage: ${d.deepSleepPercentage.toFixed(2)}%`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function() {
            tooltip.style('display', 'none');
        });
    // Adding the legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth - 180}, -40)`); // Adjust the position as needed
    // Create a background rectangle for the legend
    legend.append('rect')
        .attr('x', 0)
        .attr('y', 30)
        .attr('width', 210) // Adjust the width as needed
        .attr('height', 65) // Adjust the height as needed
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('rx', 5) // Add rounded corners
        .attr('ry', 5);

    // Add legend items
    legend.append('rect')
        .attr('x', 10)
        .attr('y', 40)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', 'steelblue');

    legend.append('text')
        .attr('x', 35)
        .attr('y', 55)
        .text('Sleep Efficiency')
        .style('text-anchor', 'start');

    // Add legend item for Deep Sleep Percentage
    legend.append('rect')
        .attr('x', 10)
        .attr('y', 70) // Move this legend item down
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', 'darkgreen');

    legend.append('text')
        .attr('x', 35)
        .attr('y', 85) // Move this text down
        .text('Deep Sleep Percentage')
        .style('text-anchor', 'start');
}