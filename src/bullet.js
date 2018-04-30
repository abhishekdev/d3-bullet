import { descending as d3Descending } from "d3-array";
import { scaleLinear as d3ScaleLinear } from "d3-scale";
import { select as d3Select } from "d3-selection";
import { timerFlush as d3TimerFlush } from "d3-timer";

function bulletRanges(d) {
  return d.ranges;
}

function bulletMarkers(d) {
  return d.markers;
}

function bulletMeasures(d) {
  return d.measures;
}

function bulletTranslate(x) {
  return d => `translate(${x(d)},0)`;
}

function bulletWidth(x) {
  return d => Math.abs(x(d) - x(0));
}

export default function() {
  let orient = "left", // TODO top & bottom
    reverse = false,
    duration = 0,
    ranges = bulletRanges,
    markers = bulletMarkers,
    measures = bulletMeasures,
    width = 380,
    height = 30,
    tickFormat = null;

  // For each small multiple…
  function bullet(g) {
    g.each(function(d, i) {
      const rangez = ranges
          .call(this, d, i)
          .slice()
          .sort(d3Descending),
        markerz = markers
          .call(this, d, i)
          .slice()
          .sort(d3Descending),
        measurez = measures
          .call(this, d, i)
          .slice()
          .sort(d3Descending),
        g = d3Select(this);

      // Compute the new x-scale.
      const x1 = d3ScaleLinear()
        .domain([0, Math.max(rangez[0], markerz[0], measurez[0])])
        .range(reverse ? [width, 0] : [0, width]);

      // Retrieve the old x-scale, if this is an update.
      const x0 =
        this.__chart__ ||
        d3ScaleLinear()
          .domain([0, Infinity])
          .range(x1.range());

      // Stash the new scale.
      this.__chart__ = x1;

      // Derive width-scales from the x-scales.
      const w0 = bulletWidth(x0),
        w1 = bulletWidth(x1);

      // Update the range rects.
      const range = g.selectAll("rect.range").data(rangez);

      range
        .enter()
        .append("rect")
        .attr("class", function(d, i) {
          return "range s" + i;
        })
        .attr("width", w0)
        .attr("height", height)
        .attr("x", reverse ? x0 : 0)
        .transition()
        .duration(duration)
        .attr("width", w1)
        .attr("x", reverse ? x1 : 0);

      range
        .transition()
        .duration(duration)
        .attr("x", reverse ? x1 : 0)
        .attr("width", w1)
        .attr("height", height);

      // Update the measure rects.
      const measure = g.selectAll("rect.measure").data(measurez);

      measure
        .enter()
        .append("rect")
        .attr("class", function(d, i) {
          return "measure s" + i;
        })
        .attr("width", w0)
        .attr("height", height / 3)
        .attr("x", reverse ? x0 : 0)
        .attr("y", height / 3)
        .transition()
        .duration(duration)
        .attr("width", w1)
        .attr("x", reverse ? x1 : 0);

      measure
        .transition()
        .duration(duration)
        .attr("width", w1)
        .attr("height", height / 3)
        .attr("x", reverse ? x1 : 0)
        .attr("y", height / 3);

      // Update the marker lines.
      const marker = g.selectAll("line.marker").data(markerz);

      marker
        .enter()
        .append("line")
        .attr("class", "marker")
        .attr("x1", x0)
        .attr("x2", x0)
        .attr("y1", height / 6)
        .attr("y2", height * 5 / 6)
        .transition()
        .duration(duration)
        .attr("x1", x1)
        .attr("x2", x1);

      marker
        .transition()
        .duration(duration)
        .attr("x1", x1)
        .attr("x2", x1)
        .attr("y1", height / 6)
        .attr("y2", height * 5 / 6);

      // Compute the tick format.
      const format = tickFormat || x1.tickFormat(8);

      // Update the tick groups.
      const tick = g.selectAll("g.tick").data(x1.ticks(8), function(d) {
        return this.textContent || format(d);
      });

      // Initialize the ticks with the old scale, x0.
      const tickEnter = tick
        .enter()
        .append("g")
        .attr("class", "tick")
        .attr("transform", bulletTranslate(x0))
        .style("opacity", 1e-6);

      tickEnter
        .append("line")
        .attr("y1", height)
        .attr("y2", height * 7 / 6);

      tickEnter
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1em")
        .attr("y", height * 7 / 6)
        .text(format);

      // Transition the entering ticks to the new scale, x1.
      tickEnter
        .transition()
        .duration(duration)
        .attr("transform", bulletTranslate(x1))
        .style("opacity", 1);

      // Transition the updating ticks to the new scale, x1.
      const tickUpdate = tick
        .transition()
        .duration(duration)
        .attr("transform", bulletTranslate(x1))
        .style("opacity", 1);

      tickUpdate
        .select("line")
        .attr("y1", height)
        .attr("y2", height * 7 / 6);

      tickUpdate.select("text").attr("y", height * 7 / 6);

      // Transition the exiting ticks to the new scale, x1.
      tick
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", bulletTranslate(x1))
        .style("opacity", 1e-6)
        .remove();
    });
    d3TimerFlush();
  }

  // left, right, top, bottom
  bullet.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x;
    reverse = orient === "right" || orient === "bottom";
    return bullet;
  };

  // ranges (bad, satisfactory, good)
  bullet.ranges = function(x) {
    if (!arguments.length) return ranges;
    ranges = x;
    return bullet;
  };

  // markers (previous, goal)
  bullet.markers = function(x) {
    if (!arguments.length) return markers;
    markers = x;
    return bullet;
  };

  // measures (actual, forecast)
  bullet.measures = function(x) {
    if (!arguments.length) return measures;
    measures = x;
    return bullet;
  };

  bullet.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return bullet;
  };

  bullet.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return bullet;
  };

  bullet.tickFormat = function(x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
    return bullet;
  };

  bullet.duration = function(x) {
    if (!arguments.length) return duration;
    duration = x;
    return bullet;
  };

  return bullet;
}
