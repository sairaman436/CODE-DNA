"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { RadarData } from "./RadarChart";

interface OverlappingRadarChartProps {
  datasets: RadarData[][];
  colors: string[];
  width?: number;
  height?: number;
}

export function OverlappingRadarChart({ datasets, colors, width = 400, height = 400 }: OverlappingRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !datasets.length || !datasets[0].length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const radius = Math.min(width, height) / 2 - Math.max(...Object.values(margin));
    const angleSlice = (Math.PI * 2) / datasets[0].length;

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Circular grid lines
    const levels = 5;
    const levelFactor = radius / levels;

    for (let i = 1; i <= levels; i++) {
      const levelRadius = levelFactor * i;
      g.selectAll(`.level-${i}`)
        .data(datasets[0])
        .enter()
        .append("line")
        .attr("x1", (d, j) => levelRadius * Math.cos(angleSlice * j - Math.PI / 2))
        .attr("y1", (d, j) => levelRadius * Math.sin(angleSlice * j - Math.PI / 2))
        .attr("x2", (d, j) => levelRadius * Math.cos(angleSlice * (j + 1) - Math.PI / 2))
        .attr("y2", (d, j) => levelRadius * Math.sin(angleSlice * (j + 1) - Math.PI / 2))
        .style("stroke", "#3f3f46")
        .style("stroke-width", "1px")
        .style("opacity", 0.5);
    }

    // Axes
    const axes = g.selectAll(".axis")
      .data(datasets[0])
      .enter()
      .append("g")
      .attr("class", "axis");

    axes.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("stroke", "#52525b")
      .style("stroke-width", "1px");

    // Labels
    axes.append("text")
      .attr("class", "legend")
      .style("font-size", "12px")
      .style("fill", "#a1a1aa")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => rScale(120) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(120) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => d.axis);

    // Draw polygons for each dataset
    const radarLine = d3.lineRadial<RadarData>()
      .angle((d, i) => i * angleSlice)
      .radius((d) => rScale(d.value))
      .curve(d3.curveLinearClosed);

    datasets.forEach((data, index) => {
      const color = colors[index] || "#ffffff";
      
      g.append("path")
        .datum(data)
        .attr("d", radarLine)
        .style("fill", color)
        .style("fill-opacity", 0.2)
        .style("stroke", color)
        .style("stroke-width", "2px")
        .transition()
        .duration(1000)
        .attrTween("d", function(d) {
          const zeroData = data.map(d => ({ ...d, value: 0 }));
          const interpolate = d3.interpolate(zeroData, d);
          return function(t) { return radarLine(interpolate(t))!; }
        });

      // Data points
      g.selectAll(`.radarCircle-set-${index}`)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", `radarCircle-set-${index}`)
        .attr("r", 4)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", color)
        .style("fill-opacity", 0.8)
        .style("opacity", 0)
        .transition()
        .delay(1000)
        .duration(500)
        .style("opacity", 1);
    });

  }, [datasets, colors, width, height]);

  return (
    <div className="relative flex justify-center items-center">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
}
