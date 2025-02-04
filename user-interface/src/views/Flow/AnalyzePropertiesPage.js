import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import {
  Flex,
  Grid,
  Box,
  Text,
  IconButton,
  Divider,
  CircularProgress,
  CircularProgressLabel,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";

import Card from "components/Card/Card";
import CardHeader from "components/Card/CardHeader";
import CardBody from "components/Card/CardBody";
import BarChart from "components/Charts/BarChart";
import {
  fetchFlowProperties,
  fetchPropertyHistograms,
} from "store/features/flowSlice";
import { fetchCsvFilesByProject } from "store/features/projectSlice";
import PieChart from "components/Charts/PieChart";

const PROPERTIES_PER_PAGE = 3; // 한 페이지당 3개

function AnalyzePropertiesPage() {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // -------------------------------
  // Redux 상태
  // -------------------------------
  const projectDatasets = useSelector(
    (state) => state.projects.datasets[projectId] || []
  );
  const histograms = useSelector(
    (state) => state.flows.histograms[flowId] || {}
  );
  const properties = useSelector(
    (state) =>
      state.flows.properties?.[flowId] || {
        numerical: [],
        categorical: [],
        text: [],
        unavailable: [],
      }
  );

  // 예: (샘플) Flow 데이터 총 크기(추정), 총 행수(가짜), 등등
  const totalSize = 123.4; // MB
  const totalRows = 543210; // 임의 값
  const numericCount = properties.numerical.length;
  const categoricalCount = properties.categorical.length;
  const unavailableCount = properties.unavailable.length;

  // 분류하기 편하도록 하나로 합침
  const allProperties = [...properties.numerical, ...properties.categorical];

  // -------------------------------
  // 로컬 state
  // -------------------------------
  const [currentPage, setCurrentPage] = useState(0);
  const fetchedRef = useRef({}); // 이미 히스토그램 fetch 시도한 prop 기록

  // -------------------------------
  // 초기 로드
  // -------------------------------
  useEffect(() => {
    dispatch(fetchFlowProperties(flowId));
    if (projectDatasets.length === 0) {
      dispatch(fetchCsvFilesByProject(projectId));
    }
  }, [dispatch, flowId, projectId, projectDatasets.length]);

  // -------------------------------
  // 페이지네이션
  // -------------------------------
  const totalPages = Math.ceil(allProperties.length / PROPERTIES_PER_PAGE);
  const currentPageProperties = allProperties.slice(
    currentPage * PROPERTIES_PER_PAGE,
    (currentPage + 1) * PROPERTIES_PER_PAGE
  );

  useEffect(() => {
    // 현재 페이지에 해당하는 property들의 히스토그램 fetch
    currentPageProperties.forEach((prop) => {
      if (!histograms[prop] && !fetchedRef.current[prop]) {
        fetchedRef.current[prop] = true;
        dispatch(fetchPropertyHistograms({ flowId, column_name: prop }));
      }
    });
  }, [currentPageProperties, histograms, dispatch, flowId]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  // -------------------------------
  // Next / Back
  // -------------------------------
  const handleNextStep = () => {
    history.push(`/projects/${projectId}/flows/${flowId}/configure-properties`);
  };
  const handleGoBack = () => {
    history.goBack();
  };

  const LeftStatsCard = ({
    totalSize, // 현재 플로우 데이터셋 용량 (MB)
    totalCapacity, // 전체 가능한 용량 (MB)
    totalRows, // 전체 rows 수
    availableRows, // 사용 가능한 rows 수
    numericCount,
    categoricalCount,
    textCount, // 만약 text property가 있다면 (없으면 0)
    unavailableCount,
  }) => {
    const pieData = [
      { label: "Numeric", value: numericCount },
      { label: "Categorical", value: categoricalCount },
      { label: "Text", value: textCount || 0 },
      { label: "Unavailable", value: unavailableCount },
    ];

    // 계산: dataset 용량 progress, rows progress (백분율)
    const capacityProgress =
      totalCapacity > 0 ? (totalSize / totalCapacity) * 100 : 0;
    const rowsProgress = totalRows > 0 ? (availableRows / totalRows) * 100 : 0;

    return (
      <Grid templateRows="0.5fr 1fr 0.5fr" gap={4} h="100%">
        {/* 카드 1: Dataset Capacity */}
        <Card>
          <CardHeader>
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Dataset Capacity
            </Text>
          </CardHeader>

          <CardBody
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={4}
          >
            <Box display="flex">
              <Text color="gray.400" fontSize="2xl">
                {totalSize}
              </Text>
              <Text color="#fff" fontSize="2xl" ml={3}>
                / {totalCapacity} MB
              </Text>
            </Box>
            <CircularProgress
              value={capacityProgress}
              size="50px"
              thickness="12px"
              color="brand.100"
            >
              <CircularProgressLabel color="white">
                {Math.round(capacityProgress)}%
              </CircularProgressLabel>
            </CircularProgress>
          </CardBody>
        </Card>

        {/* 카드 2: Property Distribution (Pie Chart) */}
        <Card>
          <CardHeader>
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Property Distribution
            </Text>
          </CardHeader>

          <CardBody
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={4}
          >
            {/* PieChart 컴포넌트를 사용 (가로/세로 크기 조정 필요) */}
            <Box width="50px" height="50px">
              <PieChart data={pieData} />
            </Box>
          </CardBody>
        </Card>

        {/* 카드 3: Rows Availability */}
        <Card>
          <CardHeader>
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Rows Availability
            </Text>
          </CardHeader>

          <CardBody
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={4}
          >
            <Box display="flex">
              <Text mt={4} fontSize="2xl" color="gray.400">
                {availableRows}
              </Text>
              <Text mt={4} fontSize="2xl" color="white" ml={3}>
                / {totalRows} Rows
              </Text>
            </Box>
            <CircularProgress
              value={rowsProgress}
              size="50px"
              thickness="12px"
              color="brand.100"
            >
              <CircularProgressLabel color="white">
                {Math.round(rowsProgress)}%
              </CircularProgressLabel>
            </CircularProgress>
          </CardBody>
        </Card>
      </Grid>
    );
  };

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }} px={6}>
      {/* 상단 헤더 */}
      <Flex justifyContent="space-between" alignItems="center" mb={6} px={6}>
        <IconButton
          icon={<ArrowBackIcon />}
          onClick={handleGoBack}
          colorScheme="blue"
        />
        <Flex direction="column" align="center">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Analyze Properties
          </Text>
          <Text fontSize="md" color="gray.400">
            (Paged histogram fetching)
          </Text>
        </Flex>
        <IconButton
          icon={<ArrowForwardIcon />}
          colorScheme="blue"
          aria-label="Next Step"
          onClick={handleNextStep}
        />
      </Flex>

      {/* 메인 그리드: 왼쪽 1열(위/아래 2카드), 오른쪽 1열(차트) */}
      <Grid templateColumns="1fr 3fr" gap={4} h="calc(80vh - 50px)">
        <Grid templateRows="2fr 1fr" gap={4}>
          {/* 왼쪽 영역: Flow Stats & Selected Datasets */}

          {/* 상단 영역: Flow 데이터 통계 (LeftStatsCards) */}
          <LeftStatsCard
            totalSize={14}
            totalCapacity={20}
            totalRows={10004}
            availableRows={5649}
            numericCount={properties.numerical.length}
            categoricalCount={properties.categorical.length}
            unavailableCount={unavailableCount}
          />

          {/* 하단 카드: Selected Datasets (예시) */}
          <Card>
            <CardHeader>
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Selected Datasets
              </Text>
            </CardHeader>
            <Divider borderColor="#fff" mb={4} />
            <CardBody>
              <Text color="white">
                {/* 예: 아직 별도 로직 없다면 간단히 보여주기 */}
                Currently selected dataset(s) info here...
              </Text>
            </CardBody>
          </Card>
        </Grid>

        {/* 오른쪽: 차트 카드 */}
        <Card>
          <CardHeader>
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Data Properties Distribution
            </Text>
          </CardHeader>
          <Divider borderColor="#fff" mb={4} />

          <CardBody
            h="500px"
            display="flex"
            flexDirection="column"
            //justifyContent="center"
            alignItems="center"
          >
            {/* 차트 3개(현재 페이지) */}
            <Grid templateColumns="repeat(3, 1fr)" gap={4} w="100%" mb={6}>
              {currentPageProperties.map((prop) => {
                const hData = histograms[prop];
                let binEdges = [];
                let counts = [];
                let avgValue = 0;
                let colorsArray = [];
                let binMin = 0;
                let binMax = 1;
                let range = 1;
                let diff = 0;
                if (hData) {
                  try {
                    // 1) binEdges, counts 파싱
                    const parsedBinEdges = JSON.parse(hData.bin_edges) || [];
                    const parsedCounts = JSON.parse(hData.counts) || [];

                    // 2) 각 요소 숫자로 변환
                    binEdges = parsedBinEdges.map((edge) => parseFloat(edge));
                    counts = parsedCounts.map((val) => parseFloat(val));

                    // 3) 평균값 계산
                    const total = counts.reduce((sum, val) => sum + val, 0);
                    avgValue = counts.length > 0 ? total / counts.length : 0;

                    // 4) colorsArray 예시
                    colorsArray = counts.map((val) =>
                      val === Math.max(...counts) ? "#582CFF" : "#2CD9FF"
                    );

                    // 5) x축 범위 확장
                    if (binEdges.length > 1) {
                      binMin = binEdges[0];
                      binMax = binEdges[binEdges.length - 1];
                      range = binMax - binMin;
                      diff = range * 0.03;
                    } else if (binEdges.length === 1) {
                      // binEdges 하나뿐이라면 diff를 1 정도로 잡거나, 임의 처리
                      binMin = binEdges[0] - 1;
                      binMax = binEdges[0] + 1;
                      diff = 0;
                    }
                  } catch (e) {
                    console.error("Histogram parse error:", e);
                  }
                }

                return (
                  <Box key={prop} textAlign="center" h="100%">
                    <Text color="gray.300" fontWeight="bold" mb={2}>
                      {prop}
                    </Text>
                    <BarChart
                      barChartData={[
                        {
                          name: prop,
                          data: binEdges.map((edge, i) => ({
                            x: edge,
                            y: counts[i] || 0,
                          })),
                        },
                      ]}
                      barChartOptions={{
                        chart: {
                          type: "bar",
                          toolbar: { show: false },
                          zoom: { enabled: false },
                        },
                        plotOptions: {
                          bar: {
                            distributed: true,
                            borderRadius: 8,
                            columnWidth: "8px",
                          },
                        },
                        xaxis: {
                          type: "numeric",
                          min: binMin - diff,
                          max: binMax + diff,
                          labels: {
                            style: { colors: "#fff", fontSize: "10px" },
                          },
                        },
                        yaxis: {
                          labels: {
                            style: { colors: "#fff", fontSize: "10px" },
                          },
                        },
                        dataLabels: { enabled: false },
                        legend: { show: false },
                        tooltip: {
                          theme: "dark",
                          y: {
                            formatter: (val) => `${parseInt(val)}`,
                          },
                          style: { fontSize: "14px" },
                        },
                        colors: colorsArray,
                        annotations: {
                          yaxis: [
                            {
                              y: avgValue,
                              borderColor: "red",
                              label: {
                                //text: AvgCount,
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
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Grid>

            {/* 페이지네이션 버튼 */}
            <Box>
              <Flex justify="center" align="center">
                <IconButton
                  aria-label="Previous Page"
                  icon={<ChevronLeftIcon />}
                  onClick={handlePrevPage}
                  isDisabled={currentPage === 0}
                  mr={2}
                />
                <Text color="white" mx={2}>
                  Page {currentPage + 1} of {totalPages}
                </Text>
                <IconButton
                  aria-label="Next Page"
                  icon={<ChevronRightIcon />}
                  onClick={handleNextPage}
                  isDisabled={currentPage === totalPages - 1}
                  ml={2}
                />
              </Flex>
            </Box>
          </CardBody>
        </Card>
      </Grid>
    </Flex>
  );
}

export default AnalyzePropertiesPage;
