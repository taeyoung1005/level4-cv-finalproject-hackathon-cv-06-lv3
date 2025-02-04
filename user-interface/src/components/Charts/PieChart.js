import React from "react";
import Chart from "react-apexcharts";

function PieChart({ data }) {
  // data: [{ label: 'Numeric', value: 10 }, { label: 'Categorical', value: 5 }, ...]
  const series = data.map((item) => item.value);
  const options = {
    chart: {
      type: "pie",
    },
    labels: data.map((item) => item.label),
    legend: {
      position: "bottom",
      labels: {
        colors: "#fff",
        fontSize: "12px",
        fontFamily: "Plus Jakarta Display",
      },
    },
    dataLabels: {
      style: {
        colors: ["#fff"],
        fontSize: "12px",
        fontFamily: "Plus Jakarta Display",
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
