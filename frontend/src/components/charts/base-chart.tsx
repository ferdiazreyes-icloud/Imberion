"use client";

import { useRef, useEffect, useMemo } from "react";
import * as echarts from "echarts/core";
import {
  BarChart, LineChart, PieChart, ScatterChart, CustomChart,
} from "echarts/charts";
import {
  GridComponent, TooltipComponent, LegendComponent,
  MarkLineComponent, DataZoomComponent, TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { editorialTheme } from "@/lib/echarts-theme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EOption = Record<string, any>;

// Register components once
echarts.use([
  BarChart, LineChart, PieChart, ScatterChart, CustomChart,
  GridComponent, TooltipComponent, LegendComponent,
  MarkLineComponent, DataZoomComponent, TitleComponent,
  CanvasRenderer,
]);

// Register theme once
let themeRegistered = false;
if (!themeRegistered) {
  echarts.registerTheme("editorial", editorialTheme);
  themeRegistered = true;
}

interface BaseChartProps {
  option: EOption;
  height?: number | string;
  className?: string;
}

export function BaseChart({ option, height = 320, className }: BaseChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Merge default options
  const mergedOption = useMemo(() => ({
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut" as const,
    tooltip: {
      trigger: "axis" as const,
      ...editorialTheme.tooltip,
    },
    grid: {
      ...editorialTheme.grid,
    },
    ...option,
  }), [option]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize chart
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, "editorial", {
        renderer: "canvas",
      });
    }

    chartRef.current.setOption(mergedOption, true);

    // Resize observer
    const ro = new ResizeObserver(() => {
      chartRef.current?.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
    };
  }, [mergedOption]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}
