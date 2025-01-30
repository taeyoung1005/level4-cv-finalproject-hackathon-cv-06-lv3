import React from "react";
import Chart from "react-apexcharts";

const PieChart = ({ pieChartData, pieChartOptions }) => {
  return (
    <Chart
      options={pieChartOptions}
      series={pieChartData[0].data} // ✅ 데이터 값만 전달
      type="pie"
      width="100%"
      height="250"
    />
  );
};

export default PieChart;
