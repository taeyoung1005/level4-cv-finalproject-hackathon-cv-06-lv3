import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Flex, Grid, IconButton, Text, Button, Input } from "@chakra-ui/react";
import { ArrowForwardIcon, ArrowBackIcon } from "@chakra-ui/icons";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import BarChart from "components/Charts/BarChart";
import { fetchFlowHistograms } from "store/features/flowSlice";
import { updateOptimizationData } from "store/features/flowSlice";

const SetGoalsPage = () => {
  const { flowId } = useParams();
  const dispatch = useDispatch();

  const properties = useSelector((state) => {
    console.log(state);
    return state.flows.newCategories[flowId] || {};
  });
  const histograms = useSelector(
    (state) => state.flows.histograms[flowId] || {}
  );

  const controllableProperties = Object.keys(properties).filter(
    (key) => properties[key] === "controllable"
  );
  const outputProperties = Object.keys(properties).filter(
    (key) => properties[key] === "output"
  );

  const [currentControllableIndex, setCurrentControllableIndex] = useState(0);
  const [currentOutputIndex, setCurrentOutputIndex] = useState(0);

  // ✅ 모든 Property 정보를 하나의 객체로 관리
  const optimizationData =
    useSelector((state) => state.flows.optimizationData[flowId]) || {};

  const [isEditing, setIsEditing] = useState({}); // 편집 모드 여부
  const [chartData, setChartData] = useState({}); // 차트 데이터 저장

  useEffect(() => {
    let isMounted = true; // ✅ 마운트 여부 확인

    dispatch(fetchFlowHistograms(flowId)).then(() => {
      if (isMounted) {
        setChartData((prev) => prev); // 기존 상태 유지
        //setOptimizationData((prev) => prev); // 기존 상태 유지
      }
    });

    return () => {
      isMounted = false; // ✅ 언마운트 시 상태 변경 방지
    };
  }, [dispatch, flowId]);

  const updatePropertyData = (property, newData, type) => {
    console.log(newData, type);
    dispatch(updateOptimizationData({ flowId, property, newData, type }));
  };

  useEffect(() => {
    const initializeProperty = (property, type) => {
      const histogramData = histograms[property];

      if (histogramData && histogramData.bin_edges && histogramData.counts) {
        try {
          const binEdges = JSON.parse(histogramData.bin_edges);
          const counts = JSON.parse(histogramData.counts);

          if (binEdges.length > 1) {
            const binCenters = binEdges
              .slice(0, -1)
              .map((_, i) => (binEdges[i] + binEdges[i + 1]) / 2);
            const minValue = binEdges[0];
            const maxValue = binEdges[binEdges.length - 1];

            // ✅ 변경이 있는 경우에만 업데이트
            setChartData((prev) => {
              const newChartData = {
                ...prev,
                [property]: {
                  barChartData: [{ name: property, data: counts }],
                  barChartOptions: {
                    xaxis: { categories: binCenters },
                    chart: { height: 200 },
                    colors: ["#4A90E2"],
                  },
                },
              };
              return JSON.stringify(prev) !== JSON.stringify(newChartData)
                ? newChartData
                : prev;
            });

            // setOptimizationData((prev) => {
            //   const newOptimizationData = {
            //     ...prev,
            //     [property]: prev[property] || {
            //       min: minValue,
            //       max: maxValue,
            //       goal:
            //         type === "controllable"
            //           ? "No Optimization"
            //           : "Fit to Property",
            //     },
            //   };
            //   return JSON.stringify(prev) !==
            //     JSON.stringify(newOptimizationData)
            //     ? newOptimizationData
            //     : prev;
            // });
          }
        } catch (error) {
          console.error("Error parsing histogram data:", error);
        }
      }
    };

    if (controllableProperties.length > 0) {
      initializeProperty(
        controllableProperties[currentControllableIndex],
        "controllable"
      );
    }

    if (outputProperties.length > 0) {
      initializeProperty(outputProperties[currentOutputIndex], "output");
    }
  }, [
    histograms,
    JSON.stringify(controllableProperties),
    currentControllableIndex,
    JSON.stringify(outputProperties),
    currentOutputIndex,
  ]);

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      <Grid templateColumns="1fr 1fr" gap={6} px={6}>
        {[
          [
            "controllable",
            "blue",
            controllableProperties,
            currentControllableIndex,
            setCurrentControllableIndex,
          ],
          [
            "output",
            "purple",
            outputProperties,
            currentOutputIndex,
            setCurrentOutputIndex,
          ],
        ].map(([type, color, properties, currentIndex, setIndex]) => {
          const property = properties[currentIndex] || "";
          const propertyData = optimizationData[property] || {
            min: "",
            max: "",
            goal: type === "output" ? "Fit to Property" : "No Optimization",
          };
          const editing = isEditing[property] || false;
          const propertyChartData = chartData[property] || {
            barChartData: [],
            barChartOptions: {},
          };

          // ✅ 최적화 목표 옵션 (Controllable과 Output을 구분)
          const optimizationOptions =
            type === "controllable"
              ? ["No Optimization", "Maximize", "Minimize", "Fit to Range"]
              : ["Maximize", "Minimize", "Fit to Range", "Fit to Property"];

          return (
            <Card key={type} w="100%">
              <CardHeader display="flex" justifyContent="space-between">
                <IconButton
                  icon={<ArrowBackIcon />}
                  onClick={() =>
                    setIndex(
                      (prev) =>
                        (prev - 1 + properties.length) % properties.length
                    )
                  }
                />
                <Text color="#fff" fontSize="lg" fontWeight="bold">
                  {property}
                </Text>
                <IconButton
                  icon={<ArrowForwardIcon />}
                  onClick={() =>
                    setIndex((prev) => (prev + 1) % properties.length)
                  }
                />
              </CardHeader>
              <CardBody
                display="flex"
                flexDirection="column"
                alignItems="center"
              >
                {/* ✅ 해당 Property의 차트 표시 */}
                <BarChart
                  barChartData={propertyChartData.barChartData}
                  barChartOptions={propertyChartData.barChartOptions}
                />

                {/* ✅ Range 설정 (Edit → Done) */}
                <Flex alignItems="center" gap={4} mt={4}>
                  <Input
                    value={propertyData.min}
                    isReadOnly={!editing}
                    onChange={(e) =>
                      updatePropertyData(
                        property,
                        {
                          min: parseFloat(e.target.value) || 0,
                        },
                        type
                      )
                    }
                  />
                  <Input
                    value={propertyData.max}
                    isReadOnly={!editing}
                    onChange={(e) =>
                      updatePropertyData(
                        property,
                        {
                          max: parseFloat(e.target.value) || 0,
                        },
                        type
                      )
                    }
                  />
                  <Button
                    colorScheme={color}
                    onClick={() =>
                      setIsEditing((prev) => ({
                        ...prev,
                        [property]: !editing,
                      }))
                    }
                  >
                    {editing ? "Done" : "Edit"}
                  </Button>
                </Flex>

                {/* ✅ 최적화 옵션 선택 */}
                <Grid templateColumns="repeat(2, 2fr)" gap={4} mt={4}>
                  {optimizationOptions.map((option) => (
                    <Button
                      key={option}
                      colorScheme={
                        propertyData.goal === option ? "green" : "gray"
                      }
                      onClick={() =>
                        updatePropertyData(property, { goal: option }, type)
                      }
                    >
                      {option}
                    </Button>
                  ))}
                </Grid>
              </CardBody>
            </Card>
          );
        })}
      </Grid>
    </Flex>
  );
};

export default SetGoalsPage;
