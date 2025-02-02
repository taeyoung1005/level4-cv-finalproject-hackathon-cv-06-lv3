import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  Flex,
  Grid,
  IconButton,
  Text,
  Button,
  Input,
  Box,
} from "@chakra-ui/react";
import { ArrowForwardIcon, ArrowBackIcon } from "@chakra-ui/icons";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import BarChart from "components/Charts/BarChart";
import { fetchFlowHistograms } from "store/features/flowSlice";
import { updateOptimizationData } from "store/features/flowSlice";
import { fetchFlowProperties } from "store/features/flowSlice";
import { fetchOptimizationData } from "store/features/flowSlice";
import { postOptimizationData } from "store/features/flowSlice";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const SetGoalsPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

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

  const reduxState = useSelector((state) => state);

  // optimizationData 초기화 함수 (이미 값이 없을 때만 업데이트)
  const initializeOptimizationDataForProperty = (property, type) => {
    if (!optimizationData[property]) {
      const histogramData = histograms[property];
      if (histogramData && histogramData.bin_edges && histogramData.counts) {
        try {
          const binEdges = JSON.parse(histogramData.bin_edges);
          if (Array.isArray(binEdges) && binEdges.length > 1) {
            const minValue = binEdges[0];
            const maxValue = binEdges[binEdges.length - 1];
            // 기본값 설정: controllable이면 "No Optimization", output이면 "Fit to Property"
            const defaultGoal =
              type === "controllable" ? "No Optimization" : "Fit to Property";

            // optimizationData 업데이트
            dispatch(
              updateOptimizationData({
                flowId,
                property,
                newData: {
                  minimum_value: minValue,
                  maximum_value: maxValue,
                  goal: defaultGoal,
                  type: type,
                },
                type,
              })
            );
            // API에서 기존 데이터가 있다면 가져오기
            dispatch(fetchOptimizationData({ flowId, property, type }));
          }
        } catch (error) {
          console.error("Error parsing histogram data:", error);
        }
      }
    }
  };

  // 차트 데이터 업데이트 함수 (항상 실행)
  const updateChartDataForProperty = (property) => {
    const histogramData = histograms[property];
    if (histogramData && histogramData.bin_edges && histogramData.counts) {
      try {
        const binEdges = JSON.parse(histogramData.bin_edges);
        const counts = JSON.parse(histogramData.counts);
        if (binEdges.length > 1) {
          const binCenters = binEdges
            .slice(0, -1)
            .map((_, i) => (binEdges[i] + binEdges[i + 1]) / 2);
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
        }
      } catch (error) {
        console.error("Error updating chart data:", error);
      }
    }
  };

  useEffect(() => {
    console.log("SetGoals Redux state:", reduxState);
  }, [reduxState]);

  useEffect(() => {
    let isMounted = true; // ✅ 마운트 여부 확인

    dispatch(fetchFlowProperties(flowId));
    dispatch(fetchFlowHistograms(flowId)).then(() => {
      if (isMounted) {
        setChartData((prev) => prev); // 기존 상태 유지
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
    // controllable property 전체에 대해 처리
    controllableProperties.forEach((property) => {
      initializeOptimizationDataForProperty(property, "controllable");
      updateChartDataForProperty(property);
    });

    // output property 전체에 대해 처리
    outputProperties.forEach((property) => {
      initializeOptimizationDataForProperty(property, "output");
      updateChartDataForProperty(property);
    });
  }, [
    histograms,
    JSON.stringify(controllableProperties),
    JSON.stringify(outputProperties),
    dispatch,
    flowId,
    optimizationData, // optimizationData가 변경되어도 업데이트 되도록
  ]);

  // 문자열 goal을 숫자로 매핑하는 헬퍼 함수
  const mapGoalToNumber = (type, goalStr) => {
    if (type === "controllable") {
      // controllable: 1: Maximize, 2: Minimize, 3: Fit to Range, 0: No Optimization
      if (goalStr === "No Optimization") return 1;
      if (goalStr === "Maximize") return 2;
      if (goalStr === "Minimize") return 3;
      if (goalStr === "Fit to Range") return 4;
      return 1; // "No Optimization" 혹은 기타
    } else if (type === "output") {
      // output: 1: Maximize, 2: Minimize, 3: Fit to Property
      if (goalStr === "Maximize") return 1;
      if (goalStr === "Minimize") return 2;
      if (goalStr === "Fit to Range") return 3;
      if (goalStr === "Fit to Property") return 4;
      return 4;
    }
    return 0;
  };

  // Next Step 버튼 클릭 시 모든 최적화 데이터를 API에 POST하고 다음 페이지로 이동
  const handleNextStep = async () => {
    try {
      const promises = [];

      // controllable property에 대해 POST 요청
      for (const property of controllableProperties) {
        const propertyData = optimizationData[property];
        if (!propertyData) continue;
        const goalNumber = mapGoalToNumber("controllable", propertyData.goal);
        promises.push(
          dispatch(
            postOptimizationData({
              flowId,
              property,
              type: "controllable",
              goal: goalNumber,
              minimum_value: propertyData.minimum_value,
              maximum_value: propertyData.maximum_value,
            })
          )
        );
      }

      console.log(outputProperties, "outputprops");

      // output property에 대해 POST 요청
      for (const property of outputProperties) {
        const propertyData = optimizationData[property];
        if (!propertyData) continue;
        const goalNumber = mapGoalToNumber("output", propertyData.goal);
        promises.push(
          dispatch(
            postOptimizationData({
              flowId,
              property,
              type: "output",
              goal: goalNumber,
              minimum_value: propertyData.minimum_value,
              maximum_value: propertyData.maximum_value,
            })
          )
        );
      }

      await Promise.all(promises);
      history.push(`/projects/${projectId}/flows/${flowId}/set-priorities`);
    } catch (error) {
      console.error("Next Step POST 요청 에러:", error);
      // 에러 처리 (예: toast 알림)
    }
  };

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      <Flex justifyContent="space-between" alignItems="center" mb={6} px={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Set Goals
          </Text>
          <Text fontSize="md" color="gray.400">
            Drag and drop properties into appropriate categories.
          </Text>
        </Box>
        <IconButton
          icon={<ArrowForwardIcon />}
          colorScheme="blue"
          aria-label="Next Step"
          onClick={handleNextStep}
        />
      </Flex>
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
            minimum_value: "",
            maximum_value: "",
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
                    value={propertyData.minimum_value}
                    isReadOnly={!editing}
                    color="#fff"
                    onChange={(e) =>
                      updatePropertyData(
                        property,
                        {
                          minimum_value: parseFloat(e.target.value) || 0,
                        },
                        type
                      )
                    }
                  />
                  <Input
                    value={propertyData.maximum_value}
                    isReadOnly={!editing}
                    color="#fff"
                    onChange={(e) =>
                      updatePropertyData(
                        property,
                        {
                          maximum_value: parseFloat(e.target.value) || 0,
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
