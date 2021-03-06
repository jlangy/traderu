import * as d3 from 'd3';
import { formatCurrency } from '@coingecko/cryptoformat';

//minimum data points to display graph
const MIN_DATA_POINTS = 4;
//Minimum value to truncate y-axis values
const LARGE_VALUES = 10000;

interface LineChartData {
  date: string,
  value: number
}

interface Margins {
  top: number,
  left: number,
  right: number,
  bottom: number
}

interface LineChartDimensions {
  width: number, 
  height: number, 
  margins: Margins
}

interface LineChartDataOptions {
  sort: boolean, 
  timeParseString: string,
  xTickInterval: string
}

function formattedValue(val: number, large = false) {
  let digits: number;
  if(large){
    return String(Math.round(val / 1000));
  }
  if(val > 0.1){
    digits = 2;
  } else if(val > 0.01){
    digits = 3;
  } else if(val > 0.001){
    digits = 4;
  }
  const formattedValue = formatCurrency(val, 'USD', 'en');
  return formattedValue.slice(0, formattedValue.lastIndexOf('.') + (digits + 1) );
}

function getStrokeColour(sort, parsedData: [number, number][]){
  if (sort) {
    //Note: date is at 0 index on parsedData entries
    const earliest:number = parsedData.reduce((a, b) => a[0] - b[0] < 0 ? a[0] : b[0], parsedData[0][0]);
    const latest = parsedData.reduce((a, b) => b[0] - a[0] < 0 ? a[0] : b[0], parsedData[0][0]);
    return latest[1] - earliest[1] < 0 ? '#ff073a' : '#75ff83';
  } else {
    const earliest = parsedData[0][0]
    const latest = parsedData[parsedData.length - 1][0]
    return   earliest - latest < 0 ? '#ff073a': '#75ff83';
  }
}

function setXAxisTicks(xTickInterval: string, data) {
  let tickFormat, xAxisTickInterval, xGridTickInterval;
  if (xTickInterval === '1year') {
    xAxisTickInterval = d3.timeMonth.every(4);
    xGridTickInterval = d3.timeMonth.every(1)
    tickFormat = d3.timeFormat('%b');
  } else if (xTickInterval === '3month') {
    xAxisTickInterval = d3.timeWeek.every(4);
    xGridTickInterval = d3.timeWeek.every(1);
    tickFormat = d3.timeFormat('%b %d');
  } else if (xTickInterval === 'Day') {
    xAxisTickInterval = d3.timeHour.every(2);
    xGridTickInterval = d3.timeMinute.every(30);
    tickFormat = d3.timeFormat('%H:%M');
  } else {
    //Find the day range data covers
    const dates = data.map(data => new Date(data.date).valueOf())
    const dayRange = Math.max(...dates) - Math.min(...dates);
    //Convert fr milomliseconds to days
    const days = dayRange / 86400000;
    //Have approx. 4 ticks on x axis
    const every = Math.round(days / 4);
    xAxisTickInterval = d3.timeDay.every(every);
    xGridTickInterval = d3.timeDay.every(Math.round(every / 4));
    tickFormat = d3.timeFormat('%d %b');
  }
  return [tickFormat, xAxisTickInterval, xGridTickInterval];
}

export const makeLineChart = (
  dimensions: LineChartDimensions,
  chartId: string,
  parentId: string,
  data: LineChartData[],
  dataOptions: LineChartDataOptions
) => {
  if (data.length < MIN_DATA_POINTS) return;
  const [tickFormat, xAxisTickInterval, xGridTickInterval] = setXAxisTicks(dataOptions.xTickInterval, data);
  const hasLargeValues = data.some(data => Number(data.value) > LARGE_VALUES);
  const parseTime = d3.timeParse(dataOptions.timeParseString);
  const parsedData = data.map(datapoint => {
    const parsedDataPoint: [number, number] = [Number(parseTime(datapoint.date)), datapoint.value]
    return parsedDataPoint;
  });
  const chart = d3.select(chartId);
  const xScale = d3
      .scaleTime()
      .range([dimensions.margins.left, dimensions.width - dimensions.margins.right])
      .domain(d3.extent(parsedData, d => d[0]));
  const yScale = d3
      .scaleLinear()
      .range([dimensions.height - dimensions.margins.top, dimensions.margins.bottom])
      .domain([
      d3.min(data, (d: LineChartData) => d.value) * 0.9,
      d3.max(data, (d: LineChartData) => d.value) * 1.1
      ])
  const xAxis = d3
      .axisBottom(xScale)
      .ticks(xAxisTickInterval)
      .tickFormat(tickFormat)
      .tickSizeOuter(0)
  const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const numberic = Number(d);
        return formattedValue(numberic, hasLargeValues)
      })
      .tickSizeOuter(0);

  function makeXGridlines() {
    return d3.axisBottom(xScale);
  }

  // gridlines in y axis function
  function makeYGridlines() {
    return d3.axisLeft(yScale);
  }

  //Append and move down x axis
  chart
    .append('svg:g')
    .attr('transform', 'translate(0,' + (dimensions.height - dimensions.margins.top) + ')')
    .call(xAxis);

  //Append and move y axis past margin
  chart
    .append('svg:g')
    .attr('transform', 'translate(' + dimensions.margins.left + ',0)')
    .call(yAxis);

  //Y-axis label for values over 10000
  if(hasLargeValues){
    chart
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0)
      .attr('x', 0 - dimensions.height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '0.6em')
      .text('Value (Thousands USD)');
  }

  //Add x gridlines
  chart
    .append('g')
    .attr('transform', 'translate(0,' + (dimensions.height - dimensions.margins.bottom) + ')')
    .call(
      makeXGridlines()
        .tickSize(-(dimensions.height - dimensions.margins.bottom - dimensions.margins.top))
        .ticks(xGridTickInterval)
        .tickFormat(() => '')
        .tickSizeOuter(0)
    );

  // add the Y gridlines
  chart
    .append('g')
    .attr('transform', 'translate(' + dimensions.margins.left + ', 0)')
    .call(
      makeYGridlines()
        .tickSize(-(dimensions.width - dimensions.margins.left - dimensions.margins.right))
        .tickFormat(() => '')
        .tickSizeOuter(0)
    );

  //Make and append line
  const lineGen = d3
    .line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  const strokeColour = getStrokeColour(dataOptions.sort, parsedData);

  chart
    .append('svg:path')
    .attr('d', lineGen(parsedData))
    .attr('stroke', strokeColour)
    .attr('stroke-dimensions.width', 4)
    .attr('fill', 'none');

  d3.selectAll('.tick line').style('opacity', '0.45');

  d3.select(window).on('resize', function() {
    if (document.getElementById(parentId.replace('#', ''))) {
      const parent = d3.select(parentId);
      const aspect = dimensions.width / dimensions.height;
      const targetWidth = Math.round(Number(parent.style('width').slice(0, -2)));
      const targetHeight = targetWidth / aspect;
      chart.attr('width', targetWidth)
      chart.attr('height', targetHeight)
      dimensions = {margins: {top: targetHeight / 6, bottom: targetHeight / 6, left: targetWidth / 8, right: targetWidth / 16}, width: targetWidth, height: targetHeight}
      chart.html('');
      makeLineChart(
        dimensions,
        chartId,
        parentId,
        data,
        dataOptions
      );
    }
  });
};
