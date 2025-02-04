import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { Flex, Grid, Box, Text, IconButton, Divider } from "@chakra-ui/react";
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
        unavailable: [],
      }
  );

  // 페이지에서 분석할 property 목록 (여기서는 numerical + categorical)
  const allProperties = [...properties.numerical, ...properties.categorical];

  // -------------------------------
  // 로컬 state
  // -------------------------------
  const [currentPage, setCurrentPage] = useState(0);

  // 이미 fetch를 시도한 property를 기록해, 중복 요청 방지
  const fetchedRef = useRef({});

  // -------------------------------
  // 초기 로드
  // -------------------------------
  useEffect(() => {
    // Property 목록
    dispatch(fetchFlowProperties(flowId));

    // CSV 목록(없으면 Fetch)
    if (projectDatasets.length === 0) {
      dispatch(fetchCsvFilesByProject(projectId));
    }
  }, [dispatch, flowId, projectDatasets.length, projectId]);

  // -------------------------------
  // 현재 페이지 properties 결정
  // -------------------------------
  const totalPages = Math.ceil(allProperties.length / PROPERTIES_PER_PAGE);
  const currentPageProperties = allProperties.slice(
    currentPage * PROPERTIES_PER_PAGE,
    (currentPage + 1) * PROPERTIES_PER_PAGE
  );

  // -------------------------------
  // 현재 페이지 property들에 대한 히스토그램 Fetch
  // -------------------------------
  useEffect(() => {
    currentPageProperties.forEach((prop) => {
      if (!histograms[prop] && !fetchedRef.current[prop]) {
        fetchedRef.current[prop] = true; // 중복 요청 방지
        dispatch(fetchPropertyHistograms({ flowId, column_name: prop }));
      }
    });
  }, [currentPageProperties, histograms, dispatch, flowId]);

  // -------------------------------
  // 페이지 이동 핸들러
  // -------------------------------
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    }
  };
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
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

  return (
    <Flex
      flexDirection="column"
      pt={{ base: "120px", md: "75px" }}
      px={6}
      h="calc(80vh - 100px)"
    >
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

      <Grid templateColumns="1fr 3fr" h="calc(80vh - 50px)" gap={4}>
        {/* 왼쪽 예시: 페이지 정보 카드 */}
        <Card>
          <CardHeader>
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Page Info
            </Text>
          </CardHeader>
          <Divider borderColor="#fff" mb={4} />
          <CardBody>
            <Text color="white">Total Properties: {allProperties.length}</Text>
            <Text color="white">
              Current Page: {currentPage + 1} / {totalPages}
            </Text>
          </CardBody>
        </Card>

        {/* 오른쪽: 현재 페이지 차트 */}
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
            justifyContent="center"
            alignItems="center"
          >
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
                      diff = range * 0.1;
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
                  <Box key={prop} textAlign="center" w="100%" h="100%">
                    <Text color="gray.300" fontWeight="bold" mt={1} mb={1}>
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
                            columnWidth: "10px",
                          },
                        },
                        dataLabels: { enabled: false },
                        legend: { show: false },

                        xaxis: {
                          type: "numeric",
                          // 6) min/max에 diff 적용
                          min: binMin - diff,
                          max: binMax + diff,
                          labels: {
                            show: true,
                            style: { colors: "#fff", fontSize: "12px" },
                          },
                        },
                        yaxis: {
                          show: true,
                          labels: {
                            show: true,
                            style: { colors: "#fff", fontSize: "12px" },
                          },
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
                              borderColor: "red",
                              label: {
                                //text: `AvgCount`,
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
                      width="100%"
                      height="200px"
                    />
                  </Box>
                );
              })}
            </Grid>

            {/* 페이지네이션 */}
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
          </CardBody>
        </Card>
      </Grid>
    </Flex>
  );
}

export default AnalyzePropertiesPage;
