import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import {
  Box,
  Flex,
  Grid,
  IconButton,
  Divider,
  Text,
  Spinner,
  HStack,
} from "@chakra-ui/react";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import Chart from "react-apexcharts";
import {
  ArrowForwardIcon,
  ArrowBackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import {
  fetchSearchResult,
  fetchOptimizationData,
} from "store/features/flowSlice";

const OptimizationResultsPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // Flow 및 기타 기본 데이터
  const flow = useSelector((state) => state.flows.flows[flowId] || {});
  // searchResult: 최적화 결과 (API 응답에서 search_result 배열)
  const searchResult = useSelector((state) => state.flows.searchResult[flowId]);
  // optimizationData: 각 property의 최적화 목표, 타입, 순서 등 (redux에 저장됨)
  const optimizationData = useSelector(
    (state) => state.flows.optimizationData[flowId] || {}
  );

  const [loading, setLoading] = useState(true);

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

  // 페이징 관련 state: 2x2 그리드를 사용하므로 한 페이지에 4개 카드
  const pageSize = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = searchResult
    ? Math.ceil(searchResult.length / pageSize)
    : 0;
  const currentResults = searchResult
    ? searchResult.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  // 페이지 마운트 시 searchResult fetch
  useEffect(() => {
    if (!flowId) return;
    dispatch(fetchSearchResult(flowId))
      .unwrap()
      .catch((err) => console.error("Error fetching search result:", err))
      .finally(() => setLoading(false));
  }, [dispatch, flowId]);

  // optimizationData fetch:
  // API 요청을 현재 페이지의 결과(currentResults)에서만 진행하고,
  // 이미 데이터가 있는 property는 건너뛰도록 처리
  useEffect(() => {
    if (currentResults && currentResults.length > 0) {
      currentResults.forEach((item) => {
        const { column_name, property_type } = item;
        // controllable/output 속성이고, 아직 redux에 데이터가 없다면 API 요청
        if (
          (property_type === "controllable" || property_type === "output") &&
          !optimizationData[column_name]
        ) {
          dispatch(
            fetchOptimizationData({
              flowId,
              property: column_name,
              type: property_type,
            })
          );
        }
      });
    }
  }, [dispatch, flowId, currentResults, optimizationData]);

  // 기본 차트 옵션 (Area 차트, 채움 효과 포함, 제목 제거)
  const baseChartOptions = useMemo(() => {
    return {
      chart: {
        type: "line",
        zoom: { enabled: false },
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val) => val.toFixed(3),
          style: {
            colors: "#fff",
            fontSize: "10px",
            fontFamily: "Plus Jakarta Display",
          },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: "dark",
        style: {
          fontSize: "12px",
          fontFamily: "Plus Jakarta Display",
        },
      },
      legend: { labels: { colors: "#fff" } },
      colors: ["#2CD9FF", "#582CFF"],
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 90, 100],
        },
      },
      grid: {
        show: false,
        padding: {
          left: 20,
        },
      },
    };
  }, []);

  // 각 결과 카드 렌더링 함수
  const renderResultCard = (item, index) => {
    const property = item.column_name;
    const optData = optimizationData[property] || null;
    const series = [
      { name: "Previous", data: item.ground_truth },
      { name: "Optimized", data: item.predicted },
    ];

    // 기본 차트 옵션 (제목은 제거한 상태)
    const options = { ...baseChartOptions };

    // 어노테이션: optData가 있으면 최소, 최대 값을 표시 (없으면 빈 객체)
    const rangeAnnotations =
      optData && optData.minimum_value !== "" && optData.maximum_value !== ""
        ? {
            yaxis: [
              {
                y: optData.minimum_value,
                borderColor: "rgba(0,227,150,0.5)",
                label: {
                  text: `Min: ${optData.minimum_value}`,
                  style: {
                    color: "#fff",
                    background: "rgba(0,227,150,0.5)",
                    fontFamily: "Plus Jakarta Display",
                    fontSize: "8px",
                  },
                },
              },
              {
                y: optData.maximum_value,
                borderColor: "rgba(255,69,96,0.5)",
                label: {
                  text: `Max: ${optData.maximum_value}`,
                  style: {
                    color: "#fff",
                    background: "rgba(255,69,96,0.5)",
                    fontFamily: "Plus Jakarta Display",
                    fontSize: "8px",
                  },
                },
              },
            ],
          }
        : {};

    const optionsWithAnnotations = {
      ...options,
      annotations: rangeAnnotations,
    };

    return (
      <Card key={index} h="300px">
        {/* 카드 헤더: property 이름 및 optimization 정보 */}
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center" w="100%">
            <Box>
              <Text fontSize="lg" fontWeight="bold">
                {property}
              </Text>
              <Text fontSize="sm" color="gray.400">
                Type: {item.property_type || "-"} | Priority:{" "}
                {optData ? optData.order || "-" : "-"}
              </Text>
            </Box>
            <Card
              bg="transparent"
              borderRadius="md"
              p={2}
              boxShadow="sm"
              w="140px"
            >
              <Text
                fontSize="sm"
                color={optData ? getGoalColor(optData.goal) : "gray.400"}
                textAlign="center"
              >
                {optData ? optData.goal || "-" : "Loading..."}
              </Text>
            </Card>
          </Flex>
        </CardHeader>
        <Divider borderColor="gray.600" />
        <CardBody p={2} h="100%">
          <Box w="100%">
            {optData ? (
              <Chart
                options={optionsWithAnnotations}
                series={series}
                type="line"
                width="100%"
                height="100%"
              />
            ) : (
              <Flex justify="center" align="center" h="100%">
                <Spinner size="md" />
              </Flex>
            )}
          </Box>
        </CardBody>
      </Card>
    );
  };

  // 페이징 핸들러
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  if (!flow) {
    return (
      <Flex pt={{ base: "120px", md: "75px" }} justify="center">
        <Text color="red.500">Flow not found</Text>
      </Flex>
    );
  }
  if (loading) {
    return (
      <Flex pt={{ base: "120px", md: "75px" }} justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex
      flexDirection="column"
      pt={{ base: "120px", md: "75px" }}
      px={4}
      color="white"
    >
      {/* 헤더 영역 */}
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <IconButton
          icon={<ArrowBackIcon />}
          onClick={() => history.goBack()}
          colorScheme="blue"
        />
        <Box textAlign="center">
          <Text fontSize="2xl" fontWeight="bold">
            Optimization Results
          </Text>
          <Text fontSize="sm" color="gray.400">
            Explore optimization outcomes by property.
          </Text>
        </Box>
        <IconButton
          icon={<ArrowForwardIcon />}
          onClick={() =>
            history.push(`/projects/${projectId}/flows/${flowId}/next-step`)
          }
          colorScheme="blue"
        />
      </Flex>

      {/* 결과 카드 영역 - 2x2 그리드 */}
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        {currentResults && currentResults.length > 0 ? (
          currentResults.map((item, index) => renderResultCard(item, index))
        ) : (
          <Text color="white" textAlign="center" width="100%">
            No optimization results available.
          </Text>
        )}
      </Grid>

      {/* 페이징 컨트롤 */}
      {totalPages > 1 && (
        <Flex justifyContent="center" alignItems="center" mt={4}>
          <HStack spacing={4}>
            <IconButton
              aria-label="Previous Page"
              icon={<ChevronLeftIcon />}
              onClick={handlePrevPage}
              isDisabled={currentPage === 1}
            />
            <Text color="white">
              Page {currentPage} of {totalPages}
            </Text>
            <IconButton
              aria-label="Next Page"
              icon={<ChevronRightIcon />}
              onClick={handleNextPage}
              isDisabled={currentPage === totalPages}
            />
          </HStack>
        </Flex>
      )}
    </Flex>
  );
};

export default OptimizationResultsPage;
