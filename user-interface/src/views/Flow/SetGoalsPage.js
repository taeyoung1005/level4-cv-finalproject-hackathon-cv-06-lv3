import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  Divider,
  IconButton,
  Input,
  Grid,
  useToast,
} from "@chakra-ui/react";
import {
  ArrowForwardIcon,
  ArrowBackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import BarChart from "components/Charts/BarChart";

import {
  fetchFlowProperties,
  updateOptimizationData,
  fetchOptimizationData,
  fetchPropertyHistograms,
  postOptimizationData,
} from "store/features/flowSlice";
import PieChart from "components/Charts/PieChart";

const SetGoalsPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();
  const toast = useToast();

  // Redux
  const properties = useSelector(
    (state) => state.flows.newCategories[flowId] || {}
  );
  const histograms = useSelector(
    (state) => state.flows.histograms[flowId] || {}
  );

  const types = useSelector((state) => state.flows.properties[flowId] || {});

  const optimizationData =
    useSelector((state) => state.flows.optimizationData[flowId]) || {};

  // Property 분류
  const controllableProperties = useMemo(
    () =>
      Object.keys(properties).filter(
        (key) => properties[key] === "controllable"
      ),
    [properties]
  );
  const outputProperties = useMemo(
    () => Object.keys(properties).filter((key) => properties[key] === "output"),
    [properties]
  );

  const getPropertyType = (property, types) => {
    if (types.numerical.includes(property)) return "numerical";
    if (types.categorical.includes(property)) return "categorical";
    if (types.text.includes(property)) return "text";
    if (types.unavailable.includes(property)) return "unavailable";
    return "numerical"; // 기본값
  };

  // 페이징
  const [currentControllablePage, setCurrentControllablePage] = useState(1);
  const [currentOutputPage, setCurrentOutputPage] = useState(1);

  // 차트 및 입력값 관리
  const [chartData, setChartData] = useState({});
  const [localValues, setLocalValues] = useState({});
  const [isEditing, setIsEditing] = useState({});

  // 로딩, 초기화
  const [isLoading, setIsLoading] = useState(true);
  const [initPropertyReady, setInitPropertyReady] = useState(false);

  // fetch 중복 방지
  const attemptedFetchRef = useRef({});
  const histogramFetchRef = useRef({});

  function combineCategories(data, limit = 15) {
    if (data.length <= limit) return data;
    // 상위 (limit - 1)개를 선택하고, 나머지는 others로 합침.
    const topCategories = data.slice(0, limit - 1);
    const othersValue = data
      .slice(limit - 1)
      .reduce((acc, item) => acc + item.value, 0);
    return [...topCategories, { label: "Others", value: othersValue }];
  }

  // ------------------------------------------------------------
  // (A) 첫 번째 useEffect:
  //   - Property가 비어있으면 fetch
  //   - 현재 페이지 property 히스토그램 & 옵티마이제이션이 없으면 fetch or 초기화
  // ------------------------------------------------------------
  useEffect(() => {
    // 1) property 목록이 없으면 한번 fetch
    const initProperties = async () => {
      if (Object.keys(properties).length === 0) {
        try {
          await dispatch(fetchFlowProperties(flowId)).unwrap();
        } catch (err) {
          console.error("Failed to fetch flow properties:", err);
        }
      }
      setInitPropertyReady(true);
    };
    initProperties();
  }, [dispatch, flowId, properties]); // properties가 아무것도 없을 때만 fetch

  useEffect(() => {
    if (!initPropertyReady) return;

    // 현재 페이지에서 보여줄 property
    const controllableProp =
      controllableProperties[currentControllablePage - 1];
    const outputProp = outputProperties[currentOutputPage - 1];

    const handlePropertyFetch = async (prop) => {
      if (!prop) return; // 없는 페이지면 스킵

      // (1) 히스토그램이 없으면 fetch
      if (!histograms[prop] && !histogramFetchRef.current[prop]) {
        histogramFetchRef.current[prop] = true;
        try {
          await dispatch(
            fetchPropertyHistograms({ flowId, column_name: prop })
          ).unwrap();
        } catch (err) {
          console.error("Failed to fetch histograms:", err);
        }
      }

      // (2) 옵티마이제이션 데이터 없으면 서버에서 fetch
      //     실패 시 히스토그램 기반 초기화
      if (!optimizationData[prop] && !attemptedFetchRef.current[prop]) {
        attemptedFetchRef.current[prop] = true;
        try {
          await dispatch(
            fetchOptimizationData({
              flowId,
              property: prop,
              type: properties[prop],
            })
          ).unwrap();
        } catch (err) {
          console.error("Failed to fetch optimization data:", err);
          // 없다면 히스토그램으로 초기화
          const histogramData = histograms[prop]?.histograms;
          if (histogramData?.bin_edges && histogramData.counts) {
            try {
              const binEdges = JSON.parse(histogramData.bin_edges);
              if (binEdges.length > 1) {
                const minEdge = binEdges[0];
                const maxEdge = binEdges[binEdges.length - 1];
                const diff = maxEdge - minEdge;
                const newMin = (minEdge - diff * 0.1)
                  .toFixed(4)
                  .replace(/\.?0+$/, "");
                const newMax = (maxEdge + diff * 0.1)
                  .toFixed(4)
                  .replace(/\.?0+$/, "");
                await dispatch(
                  updateOptimizationData({
                    flowId,
                    property: prop,
                    newData: {
                      minimum_value: newMin,
                      maximum_value: newMax,
                      goal:
                        properties[prop] === "output"
                          ? "Fit to Property"
                          : "No Optimization",
                    },
                    type: properties[prop],
                  })
                );
              }
            } catch (e) {
              console.error("Error initializing optimization data:", e);
            }
          }
        }
      }
    };

    // 실제 호출
    (async () => {
      setIsLoading(true);
      await Promise.all([
        handlePropertyFetch(controllableProp),
        handlePropertyFetch(outputProp),
      ]);
      setIsLoading(false);
    })();
  }, [
    initPropertyReady,
    currentControllablePage,
    currentOutputPage,
    controllableProperties,
    outputProperties,
    // !!! 여기에 histograms, optimizationData를 굳이 넣지 않는다 !!!
    // store가 바뀌어도 이 이펙트가 반복되지 않도록

    dispatch,
    flowId,
    properties,
  ]);

  // ------------------------------------------------------------
  // (B) 두 번째 useEffect: (읽기 전용) store → chartData 로컬 state 반영
  // ------------------------------------------------------------
  useEffect(() => {
    // 매 렌더마다 store의 값이 갱신되었는지 확인
    // 해당 property의 histogram, optimizationData 있으면 차트 세팅
    const controllableProp =
      controllableProperties[currentControllablePage - 1];
    const outputProp = outputProperties[currentOutputPage - 1];

    const updateChartDataForProperty = (prop) => {
      if (!prop) return;
      const hData = histograms[prop]; // store에서 읽기
      const oData = optimizationData[prop]; // store에서 읽기

      if (!hData || !oData) return;

      const propertyType = getPropertyType(prop, types) || "numerical";

      try {
        // numeric인 경우 BarChart 데이터 생성
        if (propertyType === "numerical") {
          const binEdges = JSON.parse(hData.bin_edges);
          const counts = JSON.parse(hData.counts);
          if (binEdges.length < 2) return;
          const diff =
            (parseFloat(binEdges[binEdges.length - 1]) -
              parseFloat(binEdges[0])) *
            0.1;
          const minX = parseFloat(oData?.minimum_value || binEdges[0] - diff);
          const maxX = parseFloat(
            oData?.maximum_value || binEdges[binEdges.length - 1] + diff
          );
          const total = counts.reduce((sum, val) => sum + val, 0);
          const avgValue = total / counts.length;
          const colorsArray = counts.map((val) =>
            val === Math.max(...counts) ? "#582CFF" : "#2CD9FF"
          );

          setChartData((prev) => ({
            ...prev,
            [prop]: {
              type: "bar",
              barChartData: [
                {
                  name: prop,
                  data: binEdges.map((edge, i) => ({
                    x: parseFloat(edge),
                    y: counts[i],
                  })),
                },
              ],
              barChartOptions: {
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  zoom: { enabled: false },
                },
                plotOptions: {
                  bar: {
                    distributed: true,
                    borderRadius: 8,
                    columnWidth: "10px",
                  },
                },
                dataLabels: { enabled: false },
                legend: { show: false },
                xaxis: {
                  type: "numeric",
                  min:
                    Math.min(parseFloat(minX), parseFloat(binEdges[0])) -
                    diff * 0.5,
                  max:
                    Math.max(
                      parseFloat(maxX),
                      parseFloat(binEdges[binEdges.length - 1])
                    ) +
                    diff * 0.5,
                  labels: {
                    style: { colors: "#fff", fontSize: "10px" },
                    rotate: -45, // 라벨을 -45도 회전
                    rotateAlways: true,
                  },
                },
                yaxis: {
                  labels: { style: { colors: "#fff", fontSize: "12px" } },
                },
                tooltip: {
                  theme: "dark",
                  y: { formatter: (val) => `${parseInt(val)}` },
                  style: { fontSize: "14px" },
                },
                colors: colorsArray,
                annotations: {
                  yaxis: [
                    {
                      y: avgValue,
                      borderColor: "yellow",
                      label: {
                        position: "left",
                        offsetX: 35,
                        style: {
                          color: "#fff",
                          background: "#0c0c0c",
                          fontSize: "8px",
                        },
                      },
                    },
                  ],
                  xaxis: [
                    {
                      x: minX,
                      borderColor: "rgba(72, 187, 120, 1)",
                    },
                    {
                      x: maxX,
                      borderColor: "rgba(252, 130, 129, 1)",
                    },
                  ],
                },
              },
            },
          }));
        } else if (propertyType === "categorical") {
          // categorical인 경우 PieChart 데이터 생성
          const binEdges = JSON.parse(hData.bin_edges);
          const counts = JSON.parse(hData.counts);
          // PieChart data: 각 bin을 항목으로, label은 binEdges, value는 counts
          let pieData = binEdges.map((edge, i) => ({
            label: edge,
            value: counts[i] || 0,
          }));

          pieData = combineCategories(pieData, 15);

          setChartData((prev) => ({
            ...prev,
            [prop]: {
              type: "pie",
              pieChartData: pieData,
              pieChartOptions: {},
            },
          }));
        }
      } catch (err) {
        console.error("Error making chart data for property:", err);
      }
    };

    // 현재 페이지 property들에 대해 차트 세팅
    updateChartDataForProperty(controllableProp);
    updateChartDataForProperty(outputProp);
  }, [
    // store에서 읽고, chartData 로컬 상태만 세팅
    // histograms, optimizationData 등이 바뀔 때마다 실행
    histograms,
    optimizationData,
    currentControllablePage,
    currentOutputPage,
    controllableProperties,
    outputProperties,
  ]);

  // ------------------------------------------------------------
  // 나머지 부분(카드 렌더링, handleNextStep 등)은 기존과 동일
  // ------------------------------------------------------------
  const handleNextStep = async () => {
    try {
      const postPromises = Object.keys(optimizationData).map((prop) => {
        const data = optimizationData[prop];
        if (!data) return null;
        return dispatch(
          postOptimizationData({
            flowId,
            property: prop,
            type: properties[prop],
            goal: data.goal,
            minimum_value: data.minimum_value,
            maximum_value: data.maximum_value,
          })
        ).unwrap();
      });
      await Promise.all(postPromises);
      history.push(`/projects/${projectId}/flows/${flowId}/set-priorities`);
    } catch (error) {
      console.error("Failed to post optimization data:", error);
      toast({
        title: "Error",
        description: "Failed to update optimization data.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
        containerStyle: {
          marginLeft: "280px",
        },
      });
    }
  };

  const getGoalColor = (goal) => {
    switch (goal) {
      case "No Optimization":
        return "gray.100";
      case "Maximize":
        return "green.100";
      case "Minimize":
        return "red.100";
      case "Fit to Range":
        return "orange.100";
      case "Fit to Property":
        return "purple.100";
      default:
        return "gray.100";
    }
  };

  const renderHeader = () => (
    <Flex justifyContent="space-between" alignItems="center" mb={6} px={6}>
      <IconButton
        icon={<ArrowBackIcon />}
        onClick={() => history.goBack()}
        colorScheme="blue"
      />
      <Flex direction="column" align="center">
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Set Goals
        </Text>
        <Text fontSize="md" color="gray.400">
          Adjust ranges and optimization options for each property.
        </Text>
      </Flex>
      <IconButton
        icon={<ArrowForwardIcon />}
        colorScheme="blue"
        aria-label="Next Step"
        onClick={handleNextStep}
      />
    </Flex>
  );

  // property 카드 렌더링
  const renderPropertyCard = (category, property) => {
    if (!property) {
      return (
        <Card w="100%" h="calc(80vh - 160px)">
          <Flex align="center" justify="center" h="100%">
            <Text color="white">No {category} property</Text>
          </Flex>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <Card w="100%" h="calc(80vh - 150px)">
          <Flex align="center" justify="center" h="100%">
            <Text color="white">Loading...</Text>
          </Flex>
        </Card>
      );
    }

    const propertyData = optimizationData[property] || {
      minimum_value: "",
      maximum_value: "",
      goal: category === "output" ? "Fit to Property" : "No Optimization",
    };
    const editing = isEditing[property] || false;
    const currentType = getPropertyType(property, types) || "numerical"; // "categorical"일 수도 있음

    const chartForProperty = chartData[property] || {
      barChartData: [],
      barChartOptions: {},
    };

    const chartComponent =
      currentType === "categorical" ? (
        <PieChart data={chartForProperty.pieChartData || []} />
      ) : (
        <BarChart
          barChartData={chartForProperty.barChartData || []}
          barChartOptions={chartForProperty.barChartOptions || {}}
        />
      );

    const optimizationOptions =
      currentType === "categorical" || category === "output"
        ? ["Maximize", "Minimize", "Fit to Range", "Fit to Property"]
        : ["No Optimization", "Maximize", "Minimize", "Fit to Range"];

    return (
      <Card w="100%" h="calc(80vh - 140px)">
        <CardHeader
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Text color="#fff" fontSize="xl" fontWeight="bold">
              {property}
            </Text>
            <Text fontSize="sm" color="gray.400">
              {category}
            </Text>
          </Box>
          <Card borderRadius="md" p={2} boxShadow="sm" w="140px">
            <Text
              fontSize="sm"
              color={getGoalColor(propertyData.goal)}
              textAlign="center"
            >
              {propertyData.goal || "-"}
            </Text>
          </Card>
        </CardHeader>
        <Divider borderColor="gray.600" />
        <CardBody display="flex" flexDirection="column" alignItems="center">
          {currentType !== "categorical" && (
            <Box w="100%" h="310px">
              {chartComponent}
            </Box>
          )}
          {currentType === "categorical" && (
            <Box h="300px" mt={4}>
              {chartComponent}
            </Box>
          )}
          {/* Target 입력 */}
          {propertyData.goal === "Fit to Property" ? (
            <Box w="50%" mt={8}>
              <Text fontSize="xs" color="gray.300" textAlign="center">
                Target Value
              </Text>
              <Input
                value={
                  localValues[property]?.target ?? propertyData.target ?? ""
                }
                isReadOnly={!editing}
                color="rgba(144, 0, 227, 0.5)"
                textAlign="center"
                onChange={(e) =>
                  setLocalValues((prev) => ({
                    ...prev,
                    [property]: {
                      ...prev[property],
                      target: e.target.value,
                    },
                  }))
                }
                onFocus={() =>
                  setIsEditing((prev) => ({ ...prev, [property]: true }))
                }
                onBlur={() => {
                  setIsEditing((prev) => ({ ...prev, [property]: false }));
                  const newValRaw = localValues[property]?.target;

                  if (currentType === "numerical") {
                    // 숫자 타입 검증
                    let newVal = parseFloat(newValRaw);
                    if (isNaN(newVal)) {
                      setLocalValues((prev) => ({
                        ...prev,
                        [property]: {
                          ...prev[property],
                          target: propertyData.target || "",
                        },
                      }));
                      toast({
                        title: "Invalid value",
                        description: "Please enter a numeric value for Target.",
                        status: "error",
                        duration: 1000,
                        isClosable: true,
                      });
                      return;
                    }
                    const formatted = newVal.toFixed(4).replace(/\.?0+$/, "");
                    setLocalValues((prev) => ({
                      ...prev,
                      [property]: { ...prev[property], target: formatted },
                    }));
                    dispatch(
                      updateOptimizationData({
                        flowId,
                        property,

                        newData: {
                          minimum_value: parseFloat(formatted),
                          maximum_value: parseFloat(formatted),
                        },
                        category,
                      })
                    );
                    toast({
                      title: "Optimization target updated.",
                      description: `Target value updated to ${newVal}.`,
                      status: "success",
                      duration: 1000,
                      isClosable: true,
                    });
                  } else if (currentType === "categorical") {
                    // 범주형 타입 검증
                    // chartForProperty.pieChartData에 실제 카테고리 값들이 있다고 가정
                    const allowedValues = (
                      chartForProperty.pieChartData || []
                    ).map((item) => item.label);
                    if (allowedValues.includes(newValRaw)) {
                      // 여기서 target 대신에 minimum_value(또는 maximum_value)로 저장할 수 있음.
                      // 예시로 minimum_value를 업데이트하는 식으로 처리:
                      dispatch(
                        updateOptimizationData({
                          flowId,
                          property,
                          newData: {
                            minimum_value: newValRaw,
                            maximum_value: newValRaw,
                          },
                          category,
                        })
                      );
                      toast({
                        title: "Optimization value updated.",
                        description: `Target value updated to ${newValRaw}.`,
                        status: "success",
                        duration: 1000,
                        isClosable: true,
                      });
                    } else {
                      // 유효하지 않으면 이전 값으로 복구
                      setLocalValues((prev) => ({
                        ...prev,
                        [property]: {
                          ...prev[property],
                          target: propertyData.target || "",
                        },
                      }));
                      toast({
                        title: "Invalid value",
                        description:
                          "Please enter one of the allowed category values: " +
                          allowedValues.join(", "),
                        status: "error",
                        duration: 1000,
                        isClosable: true,
                      });
                    }
                  }
                }}
              />
            </Box>
          ) : (
            <Box w="100%" mt={7}>
              <Flex alignItems="center" gap={4}>
                <Box w="100%">
                  <Text
                    fontSize="xs"
                    color="gray.300"
                    textAlign="center"
                    mb={1}
                  >
                    Min
                  </Text>
                  <Input
                    value={
                      localValues[property]?.min ?? propertyData.minimum_value
                    }
                    isReadOnly={!editing}
                    color="rgba(0, 227, 150, 0.5)"
                    textAlign="center"
                    onChange={(e) =>
                      setLocalValues((prev) => ({
                        ...prev,
                        [property]: { ...prev[property], min: e.target.value },
                      }))
                    }
                    onFocus={() =>
                      setIsEditing((prev) => ({ ...prev, [property]: true }))
                    }
                    onBlur={() => {
                      setIsEditing((prev) => ({ ...prev, [property]: false }));
                      const newValRaw = localValues[property]?.min;
                      let newVal = parseFloat(newValRaw);
                      const currentMax = parseFloat(propertyData.maximum_value);
                      if (isNaN(newVal)) {
                        setLocalValues((prev) => ({
                          ...prev,
                          [property]: {
                            ...prev[property],
                            min: propertyData.minimum_value,
                          },
                        }));
                        toast({
                          title: "Invalid value",
                          description: "Please enter a numeric value for Min.",
                          status: "error",
                          duration: 1000,
                          isClosable: true,
                        });
                        return;
                      }
                      if (newVal >= currentMax) {
                        setLocalValues((prev) => ({
                          ...prev,
                          [property]: {
                            ...prev[property],
                            min: propertyData.minimum_value,
                          },
                        }));
                        toast({
                          title: "Invalid range",
                          description:
                            "Min cannot be greater than or equal to Max.",
                          status: "error",
                          duration: 1000,
                          isClosable: true,
                        });
                        return;
                      }
                      // 포맷팅: 숫자를 원하는 소수점 자리까지 표현한 문자열로 변환
                      const formatted = newVal.toFixed(4).replace(/\.?0+$/, "");
                      setLocalValues((prev) => ({
                        ...prev,
                        [property]: { ...prev[property], min: formatted },
                      }));
                      // API 요청시, 문자열 형태로 업데이트 (여기서는 formatted가 string임)
                      dispatch(
                        updateOptimizationData({
                          flowId,
                          property,
                          newData: { minimum_value: formatted },
                          category,
                        })
                      );
                      toast({
                        title: "Optimization range updated.",
                        description: `Min value has been updated to ${formatted}.`,
                        status: "success",
                        duration: 1000,
                        isClosable: true,
                      });
                    }}
                  />
                </Box>
                <Box w="100%">
                  <Text
                    fontSize="xs"
                    color="gray.300"
                    textAlign="center"
                    mb={1}
                  >
                    Max
                  </Text>
                  <Input
                    value={
                      localValues[property]?.max ?? propertyData.maximum_value
                    }
                    isReadOnly={!editing}
                    color="rgba(255, 69, 96, 0.5)"
                    textAlign="center"
                    onChange={(e) =>
                      setLocalValues((prev) => ({
                        ...prev,
                        [property]: { ...prev[property], max: e.target.value },
                      }))
                    }
                    onFocus={() =>
                      setIsEditing((prev) => ({ ...prev, [property]: true }))
                    }
                    onBlur={() => {
                      setIsEditing((prev) => ({ ...prev, [property]: false }));
                      const newValRaw = localValues[property]?.max;
                      let newVal = parseFloat(newValRaw);
                      const currentMin = parseFloat(propertyData.minimum_value);
                      if (isNaN(newVal)) {
                        setLocalValues((prev) => ({
                          ...prev,
                          [property]: {
                            ...prev[property],
                            max: propertyData.maximum_value,
                          },
                        }));
                        toast({
                          title: "Invalid value",
                          description: "Please enter a numeric value for Max.",
                          status: "error",
                          duration: 1000,
                          isClosable: true,
                        });
                        return;
                      }
                      if (newVal <= currentMin) {
                        setLocalValues((prev) => ({
                          ...prev,
                          [property]: {
                            ...prev[property],
                            max: propertyData.maximum_value,
                          },
                        }));
                        toast({
                          title: "Invalid range",
                          description:
                            "Max cannot be less than or equal to Min.",
                          status: "error",
                          duration: 1000,
                          isClosable: true,
                        });
                        return;
                      }
                      const formatted = newVal.toFixed(4).replace(/\.?0+$/, "");
                      setLocalValues((prev) => ({
                        ...prev,
                        [property]: { ...prev[property], max: formatted },
                      }));
                      dispatch(
                        updateOptimizationData({
                          flowId,
                          property,
                          newData: { maximum_value: formatted }, // dispatch 시에도 string으로 전송
                          category,
                        })
                      );
                      toast({
                        title: "Optimization range updated.",
                        description: `Max value has been updated to ${formatted}.`,
                        status: "success",
                        duration: 1000,
                        isClosable: true,
                      });
                    }}
                  />
                </Box>
              </Flex>
            </Box>
          )}
          ;{/* Goal 설정 */}
          <Box w="100%" mt={0}>
            <Grid templateColumns="repeat(2, 2fr)" gap={2}>
              {optimizationOptions.map((option) => (
                <Button
                  key={option}
                  bg={
                    propertyData.goal === option
                      ? getGoalColor(option)
                      : "linear-gradient(125deg,rgba(74, 81, 114, 0.5) 0%,rgba(98, 119, 157, 0.8) 50%, rgba(13, 23, 67, 0.5) 100%)"
                  }
                  color={propertyData.goal === option ? "#0c1c1c" : "#fff"}
                  isDisabled={propertyData.goal === option}
                  _hover={{ bg: "blue.100" }}
                  onClick={() => {
                    // 만약 categorical 또는 output인데 옵션이 Fit to Property가 아니면 경고 toast
                    if (
                      (currentType === "categorical" ||
                        category === "output") &&
                      option !== "Fit to Property"
                    ) {
                      toast({
                        title: "Invalid Option",
                        description:
                          "For categorical or output properties, only 'Fit to Property' is allowed.",
                        status: "warning",
                        duration: 3000,
                        isClosable: true,
                        containerStyle: {
                          marginLeft: "280px",
                        },
                      });
                      return;
                    }
                    dispatch(
                      updateOptimizationData({
                        flowId,
                        property,
                        newData: { goal: option },
                        category,
                      })
                    );
                  }}
                >
                  {option}
                </Button>
              ))}
            </Grid>
          </Box>
        </CardBody>
      </Card>
    );
  };

  // 페이징
  const totalControllablePages = controllableProperties.length;
  const totalOutputPages = outputProperties.length;
  const currentControllableProperty =
    controllableProperties[currentControllablePage - 1] || "";
  const currentOutputProperty = outputProperties[currentOutputPage - 1] || "";

  const renderPagination = (currentPage, totalPages, setPage) => (
    <Flex justify="center" align="center" mt={4}>
      <IconButton
        aria-label="Previous Page"
        icon={<ChevronLeftIcon />}
        onClick={() => setPage((prev) => (prev > 1 ? prev - 1 : prev))}
        isDisabled={currentPage === 1}
      />
      <Text color="white" mx={2}>
        Page {currentPage} of {totalPages}
      </Text>
      <IconButton
        aria-label="Next Page"
        icon={<ChevronRightIcon />}
        onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
        isDisabled={currentPage === totalPages}
      />
    </Flex>
  );

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }} px={6}>
      {renderHeader()}
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} px={6}>
        <Box>
          {renderPropertyCard("controllable", currentControllableProperty)}
          {totalControllablePages > 1 &&
            renderPagination(
              currentControllablePage,
              totalControllablePages,
              setCurrentControllablePage
            )}
        </Box>
        <Box>
          {renderPropertyCard("output", currentOutputProperty)}
          {totalOutputPages > 1 &&
            renderPagination(
              currentOutputPage,
              totalOutputPages,
              setCurrentOutputPage
            )}
        </Box>
      </Grid>
    </Flex>
  );
};

export default SetGoalsPage;
