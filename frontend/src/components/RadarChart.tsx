"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface RadarData {
  axis: string;
  value: number; // 0 to 100
}

interface RadarChartProps {
  data: RadarData[];
  width?: number;
  height?: number;
  color?: string;
}

export function RadarChart({ data, width = 400, height = 400, color = "#10b981" }: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const radius = Math.min(width, height) / 2 - Math.max(...Object.values(margin));
    const angleSlice = (Math.PI * 2) / data.length;

    // Scale for the radius
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Draw circular grid lines
    const levels = 5;
    const levelFactor = radius / levels;

    for (let i = 1; i <= levels; i++) {
      const levelRadius = levelFactor * i;
      g.selectAll(`.level-${i}`)
        .data(data)
        .enter()
        .append("line")
        .attr("x1", (d, j) => levelRadius * Math.cos(angleSlice * j - Math.PI / 2))
        .attr("y1", (d, j) => levelRadius * Math.sin(angleSlice * j - Math.PI / 2))
        .attr("x2", (d, j) => levelRadius * Math.cos(angleSlice * (j + 1) - Math.PI / 2))
        .attr("y2", (d, j) => levelRadius * Math.sin(angleSlice * (j + 1) - Math.PI / 2))
        .style("stroke", "#3f3f46") // zinc-700
        .style("stroke-width", "1px")
        .style("opacity", 0.5);
    }

    // Draw axes
    const axes = g.selectAll(".axis")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "axis");

    axes.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("stroke", "#52525b") // zinc-600
      .style("stroke-width", "1px");

    // Add labels
    axes.append("text")
      .attr("class", "legend")
      .style("font-size", "12px")
      .style("fill", "#a1a1aa") // zinc-400
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => rScale(120) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(120) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => d.axis);

    // Draw the radar area
    const radarLine = d3.lineRadial<RadarData>()
      .angle((d, i) => i * angleSlice)
      .radius((d) => rScale(d.value))
      .curve(d3.curveLinearClosed);

    g.append("path")
      .datum(data)
      .attr("d", radarLine)
      .style("fill", color)
      .style("fill-opacity", 0.15)
      .style("stroke", color)
      .style("stroke-width", "1.5px")
      .transition()
      .duration(1000)
      .attrTween("d", function(d) {
        // Simple animation from center out
        const zeroData = data.map(d => ({ ...d, value: 0 }));
        const interpolate = d3.interpolate(zeroData, d);
        return function(t) { return radarLine(interpolate(t))!; }
      });

    // Add data points
    g.selectAll(".radarCircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "radarCircle")
      .attr("r", 4)
      .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("fill", color)
      .style("fill-opacity", 0.9)
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1);

    // Add hover interactions for points
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#18181b") // zinc-900
      .style("color", "#f4f4f5") // zinc-100
      .style("padding", "8px 12px")
      .style("border-radius", "8px")
      .style("border", "1px solid #27272a") // zinc-800
      .style("pointer-events", "none")
      .style("font-size", "14px")
      .style("font-weight", "500");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.selectAll(".radarCircle")
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .transition().duration(200)
          .attr("r", 8)
          .style("fill", "#fff");

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`${d.axis}: <span style="color:${color}">${d.value}</span>`)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 15) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition().duration(200)
          .attr("r", 4)
          .style("fill", color);

        tooltip.transition().duration(200).style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };

  }, [data, width, height]);

  return (
    <div className="relative flex justify-center items-center">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
}
