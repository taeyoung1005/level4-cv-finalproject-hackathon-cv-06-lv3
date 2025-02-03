import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  Divider,
  IconButton,
  Badge,
  Input,
  Grid,
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
  fetchFlowHistograms,
  initializePriorities,
} from "store/features/flowSlice";
import { postOptimizationData } from "store/features/flowSlice";

const SetGoalsPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // Redux: properties (newCategories)
  const properties = useSelector(
    (state) => state.flows.newCategories[flowId] || {}
  );
  // histograms: histogram data per property
  const histograms = useSelector(
    (state) => state.flows.histograms[flowId] || {}
  );

  // controllable/output property 분리
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

  // 현재 선택된 property의 인덱스 (각 카테고리 별: 페이지 단위로 1개씩 보여줌)
  const [currentControllablePage, setCurrentControllablePage] = useState(1);
  const [currentOutputPage, setCurrentOutputPage] = useState(1);

  // optimizationData: 각 property의 최적화 데이터
  const optimizationData =
    useSelector((state) => state.flows.optimizationData[flowId]) || {};

  // 로컬 상태: 편집 모드, 차트 데이터 등
  const [isEditing, setIsEditing] = useState({});
  const [chartData, setChartData] = useState({});

  // Flow properties 및 histogram fetch
  useEffect(() => {
    dispatch(fetchFlowProperties(flowId));
    dispatch(fetchFlowHistograms(flowId));
  }, [dispatch, flowId]);

  // controllable/output property에 대해 optimizationData fetch
  useEffect(() => {
    Object.keys(properties).forEach((property) => {
      const type = properties[property];
      if (type === "controllable" || type === "output") {
        dispatch(fetchOptimizationData({ flowId, property, type }));
      }
    });
  }, [dispatch, flowId, properties]);

  // histogram 데이터에 따른 차트 데이터 업데이트 함수
  const updateChartDataForProperty = (property) => {
    const histogramData = histograms[property];
    if (histogramData && histogramData.bin_edges && histogramData.counts) {
      try {
        const binEdges = JSON.parse(histogramData.bin_edges);
        const counts = JSON.parse(histogramData.counts);
        if (binEdges.length > 1) {
          const total = counts.reduce((sum, val) => sum + val, 0);
          const avgValue = total / counts.length;
          const maxValue = Math.max(...counts);
          const colorsArray = counts.map((val) =>
            val === maxValue ? "#582CFF" : "#2CD9FF"
          );
          setChartData((prev) => {
            const newChartData = {
              ...prev,
              [property]: {
                barChartData: [{ name: property, data: counts }],
                barChartOptions: {
                  chart: { type: "bar", toolbar: { show: false } },
                  plotOptions: {
                    bar: {
                      distributed: true,
                      borderRadius: 8,
                      columnWidth: "10px",
                    },
                  },
                  dataLabels: {
                    enabled: false,
                  },
                  legend: { show: false },
                  xaxis: {
                    title: {
                      text: `${property}`,
                      style: { color: "#fff" },
                    },
                    categories: binEdges,
                    labels: {
                      show: true,
                      style: {
                        colors: "#fff",
                        fontSize: "12px",
                        fontFamily: "Plus Jakarta Display",
                      },
                    },
                    axisBorder: {
                      show: false,
                    },
                    axisTicks: {
                      show: true,
                    },
                  },
                  yaxis: {
                    show: true,
                    color: "#fff",
                    // categories: counts,
                    labels: {
                      show: true,
                      style: {
                        colors: "#fff",
                        fontSize: "12px",
                        fontFamily: "Plus Jakarta Display",
                      },
                    },
                  },
                  tooltip: {
                    theme: "dark",
                    y: { formatter: (val) => `${parseInt(val)}` },
                    style: {
                      fontSize: "14px",
                      fontFamily: "Plus Jakarta Display",
                    },
                    onDatasetHover: {
                      style: {
                        fontSize: "14px",
                        fontFamily: "Plus Jakarta Display",
                      },
                    },
                  },
                  colors: colorsArray,
                  annotations: {
                    yaxis: [
                      {
                        y: avgValue,
                        borderColor: "red",
                      },
                    ],
                  },
                  responsive: [
                    {
                      breakpoint: 768,
                      options: {
                        plotOptions: {
                          bar: {
                            borderRadius: 0,
                          },
                        },
                      },
                    },
                  ],
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
    controllableProperties.forEach((property) => {
      updateChartDataForProperty(property);
    });
    outputProperties.forEach((property) => {
      updateChartDataForProperty(property);
    });
  }, [histograms, controllableProperties, outputProperties]);

  // 초기 페이징: 만약 optimizationData가 로드되면 default 순서(기본 우선순위)를 설정
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && Object.keys(optimizationData).length > 0) {
      // 기본 순서는 controllable, output 순서대로
      const defaultControllable = controllableProperties;
      const defaultOutput = outputProperties;
      if (defaultControllable.length > 0) setCurrentControllablePage(1);
      if (defaultOutput.length > 0) setCurrentOutputPage(1);
      initializedRef.current = true;
    }
  }, [optimizationData, controllableProperties, outputProperties]);

  // Next Step 버튼 (여기서는 별도의 저장 없이 바로 다음 페이지로 이동)
  const handleNextStep = async () => {
    // API 요청 로직은 기존 postOptimizationData를 활용하여 각 property의 데이터를 저장하는 방식
    // 생략하고, 단순히 다음 페이지로 이동하도록 처리 (혹은 추가 로직을 넣을 수 있음)
    history.push(`/projects/${projectId}/flows/${flowId}/check-performance`);
  };

  // 각 goal에 따른 색상 결정 함수 (어두운 배경에 어울리는 밝은 색상)
  const getGoalColor = (goal) => {
    switch (goal) {
      case "No Optimization":
        return "gray.200";
      case "Maximize":
        return "green.200";
      case "Minimize":
        return "red.200";
      case "Fit to Range":
        return "orange.200";
      case "Fit to Property":
        return "purple.200";
      default:
        return "gray.200";
    }
  };

  // Header 영역 렌더링 함수
  const renderHeader = () => (
    <Flex justifyContent="space-between" alignItems="center" mb={6} px={6}>
      <Button leftIcon={<ArrowBackIcon />} onClick={() => history.goBack()}>
        Back
      </Button>
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

  // 각 property 카드 렌더링 함수 (인자로 type과 property 이름을 받음)
  const renderPropertyCard = (type, property) => {
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
    const optimizationOptions =
      type === "controllable"
        ? ["No Optimization", "Maximize", "Minimize", "Fit to Range"]
        : ["Maximize", "Minimize", "Fit to Range", "Fit to Property"];

    return (
      <Card w="100%" h="calc(80vh - 160px)">
        <CardHeader
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              {property}
            </Text>
            <Text fontSize="sm" color="gray.400">
              Type: {type}
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

        <CardBody display="flex" flexDirection="column" alignItems="center">
          <Box w="100%">
            <BarChart
              barChartData={propertyChartData.barChartData}
              barChartOptions={propertyChartData.barChartOptions}
            />
          </Box>
          <Flex alignItems="center" gap={4} mt={4}>
            <Input
              value={propertyData.minimum_value}
              isReadOnly={!editing}
              color="#fff"
              onChange={(e) =>
                dispatch(
                  updateOptimizationData({
                    flowId,
                    property,
                    newData: {
                      minimum_value: parseFloat(e.target.value) || 0,
                    },
                    type,
                  })
                )
              }
            />
            <Input
              value={propertyData.maximum_value}
              isReadOnly={!editing}
              color="#fff"
              onChange={(e) =>
                dispatch(
                  updateOptimizationData({
                    flowId,
                    property,
                    newData: {
                      maximum_value: parseFloat(e.target.value) || 0,
                    },
                    type,
                  })
                )
              }
            />
            <Button
              colorScheme={type === "controllable" ? "blue" : "purple"}
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
          <Grid templateColumns="repeat(2, 2fr)" gap={4} mt={4}>
            {optimizationOptions.map((option) => (
              <Button
                key={option}
                colorScheme={propertyData.goal === option ? "green" : "gray"}
                onClick={() =>
                  dispatch(
                    updateOptimizationData({
                      flowId,
                      property,
                      newData: { goal: option },
                      type,
                    })
                  )
                }
              >
                {option}
              </Button>
            ))}
          </Grid>
        </CardBody>
      </Card>
    );
  };

  // 전체 페이지 수 계산 (각 카테고리별)
  const totalControllablePages = controllableProperties.length;
  const totalOutputPages = outputProperties.length;
  const currentControllableProperty =
    controllableProperties[currentControllablePage - 1] || "";
  const currentOutputProperty = outputProperties[currentOutputPage - 1] || "";

  // 페이징 컨트롤 렌더링 함수
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
          {renderPagination(
            currentControllablePage,
            totalControllablePages,
            setCurrentControllablePage
          )}
        </Box>
        <Box>
          {renderPropertyCard("output", currentOutputProperty)}
          {renderPagination(
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
