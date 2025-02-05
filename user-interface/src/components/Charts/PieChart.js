import React from "react";
import Chart from "react-apexcharts";

function PieChart({ data, colorsArray }) {
  // data: [{ label: 'Numeric', value: 10 }, { label: 'Categorical', value: 5 }, ...]
  const series = data.map((item) => item.value);
  const options = {
    chart: {
      type: "pie",
    },
    labels: data.map((item) => item.label),
    stroke: {
      show: false, // 또는 width: 0,
    },
    legend: {
      show: false,
    },
    colors: colorsArray,
    dataLabels: {
      style: {
        colors: ["#fff"],
        fontSize: "12px",
      },
    },
    tooltip: {
      theme: "dark",
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return <Chart options={options} series={series} type="pie" width="100%" />;
}

export default PieChart;
