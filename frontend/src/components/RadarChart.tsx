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

    // Adjust margins for labels
    const margin = { top: 70, right: 70, bottom: 70, left: 70 };
    const radius = Math.min(width, height) / 2 - 80;
    const angleSlice = (Math.PI * 2) / data.length;

    // Scale for the radius
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    // Container group
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Define Glow Filter
    const filter = svg.append("defs").append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw circular grid lines (Concentric Polygons)
    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      const levelRadius = (radius / levels) * i;
      g.selectAll(`.level-${i}`)
        .data([data])
        .enter()
        .append("polygon")
        .attr("points", d => d.map((_, j) => {
          const x = levelRadius * Math.cos(angleSlice * j - Math.PI / 2);
          const y = levelRadius * Math.sin(angleSlice * j - Math.PI / 2);
          return `${x},${y}`;
        }).join(" "))
        .style("fill", "none")
        .style("stroke", "#ffffff")
        .style("stroke-width", "0.5px")
        .style("opacity", 0.08);
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
      .style("stroke", "#ffffff")
      .style("stroke-width", "0.5px")
      .style("opacity", 0.15);

    // Add labels with better positioning and typography
    axes.append("text")
      .attr("class", "legend")
      .style("font-size", "10px")
      .style("font-weight", "800")
      .style("letter-spacing", "0.15em")
      .style("text-transform", "uppercase")
      .style("fill", "#71717a") // zinc-500
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => rScale(135) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(135) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => d.axis)
      .transition()
      .duration(1000)
      .style("fill", "#a1a1aa");

    // Radar line generator
    const radarLine = d3.lineRadial<RadarData>()
      .angle((d, i) => i * angleSlice)
      .radius((d) => rScale(d.value))
      .curve(d3.curveLinearClosed);

    // Draw the radar area with glow
    const blobWrapper = g.append("g").attr("class", "radarWrapper");

    blobWrapper.append("path")
      .datum(data)
      .attr("class", "radarArea")
      .attr("d", radarLine)
      .style("fill", color)
      .style("fill-opacity", 0.1)
      .style("stroke", color)
      .style("stroke-width", "2px")
      .style("filter", "url(#glow)")
      .transition()
      .duration(1200)
      .ease(d3.easeElasticOut.amplitude(1).period(0.6))
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate(data.map(val => ({ ...val, value: 0 })), d);
        return function(t) { return radarLine(interpolate(t))!; }
      });

    // Add data points
    blobWrapper.selectAll(".radarCircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "radarCircle")
      .attr("r", 3.5)
      .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("fill", color)
      .style("stroke", "#fff")
      .style("stroke-width", "1px")
      .style("fill-opacity", 0.9)
      .style("opacity", 0)
      .transition()
      .delay(800)
      .duration(500)
      .style("opacity", 1);

    // Interactive tooltip logic
    const tooltip = d3.select("body").append("div")
      .attr("class", "radar-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(9, 9, 11, 0.9)")
      .style("backdrop-filter", "blur(12px)")
      .style("color", "#fff")
      .style("padding", "10px 14px")
      .style("border-radius", "12px")
      .style("border", "1px solid rgba(255,255,255,0.1)")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("z-index", "1000");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blobWrapper.selectAll(".radarCircle")
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .transition().duration(200)
          .attr("r", 7)
          .style("fill", "#fff");

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">${d.axis}</span>
            <span className="text-emerald-400 text-sm">${d.value}%</span>
          </div>
        `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 15) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition().duration(200)
          .attr("r", 3.5)
          .style("fill", color);

        tooltip.transition().duration(200).style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };

  }, [data, width, height, color]);

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" />
    </div>
  );
}
