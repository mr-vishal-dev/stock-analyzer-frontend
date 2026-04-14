import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import '../styles/Chart.css';

export default function Chart({ categories = [], values = [], title = 'Price chart' }) {
  const chartRef = useRef(null);

  useEffect(() => {
    const chartNode = chartRef.current;
    if (!chartNode) return;

    try {
      const chart = echarts.init(chartNode);
      const option = {
        title: {
          text: title,
          left: 'left',
          textStyle: {
            color: '#fff',
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: { backgroundColor: '#6a7985' },
          },
        },
        grid: {
          left: '6%',
          right: '4%',
          bottom: '8%',
          top: '18%',
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLine: { lineStyle: { color: '#6f7a96' } },
          axisLabel: { color: '#c7d3ef' },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#6f7a96' } },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
          axisLabel: { color: '#c7d3ef' },
        },
        series: [
          {
            name: 'Close',
            type: 'line',
            data: values,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#00d4ff', width: 3 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0, 212, 255, 0.35)' },
                  { offset: 1, color: 'rgba(0, 212, 255, 0.05)' },
                ],
              },
            },
          },
        ],
        backgroundColor: 'transparent',
      };

      chart.setOption(option);
      
      const handleResize = () => {
        chart.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    } catch (error) {
      console.error('Chart initialization error:', error);
    }
  }, [categories, values, title]);

  return (
    <div className="chart-card">
      <div ref={chartRef} className="chart-root" />
    </div>
  );
}
