import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  Text,
} from "@chakra-ui/react";
import { ArrowForwardIcon, ArrowBackIcon } from "@chakra-ui/icons";
import BarChart from "components/Charts/BarChart";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import SelectedDataArea from "components/Card/SelectedDataArea";
import {
  fetchFlowProperties,
  fetchFlowHistograms,
} from "store/features/flowSlice";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { fetchCsvFilesByProject } from "store/features/projectSlice";

const MAX_BINS = 20; // ✅ 최대 20개까지만 표시
const CHARTS_PER_PAGE = 5; // ✅ 한 번에 5개씩 보여줌

const AnalyzePropertiesPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // ✅ Redux에서 데이터 가져오기
  const flow = useSelector((state) => state.flows.flows[flowId] || {});
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

  const reduxState = useSelector((state) => state);
  useEffect(() => {
    console.log("AnalyzePropertiesPage Redux state:", reduxState);
  }, [reduxState]);

  // ✅ 선택된 데이터셋
  const selectedDatasets = useSelector(
    (state) => state.flows.flows[flowId]?.csv
  );

  // ✅ 차트 데이터 상태
  const [chartData, setChartData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // ✅ 현재 페이지 인덱스

  useEffect(() => {
    dispatch(fetchFlowProperties(flowId));
    dispatch(fetchFlowHistograms(flowId));
  }, [dispatch, flowId]);

  // ✅ 새로고침 시 데이터 유지하도록 API 요청
  useEffect(() => {
    if (!projectDatasets.length) {
      dispatch(fetchCsvFilesByProject(projectId));
    }
  }, [dispatch, projectId, projectDatasets.length]);

  // ✅ Histogram 데이터를 가공하여 차트용 데이터 변환
  useEffect(() => {
    if (histograms && Object.keys(histograms).length > 0) {
      const transformedData = Object.entries(histograms)
        .map(([columnName, { counts, bin_edges }]) => {
          try {
            let parsedCounts = JSON.parse(counts);
            let parsedBinEdges = JSON.parse(bin_edges).map((edge) =>
              decodeURIComponent(escape(edge.toString()))
            );

            // ✅ counts와 bin_edges 길이가 20 초과하면 자르기
            if (parsedCounts.length > MAX_BINS) {
              parsedCounts = parsedCounts.slice(0, MAX_BINS);
              parsedBinEdges = parsedBinEdges.slice(0, MAX_BINS);
              parsedBinEdges[MAX_BINS - 1] += " ..."; // 마지막 항목에 '...' 추가
            }

            return {
              name: columnName,
              data: parsedCounts,
              categories: parsedBinEdges,
            };
          } catch (error) {
            console.error(
              `❌ Histogram Parsing Error for ${columnName}:`,
              error
            );
            return null;
          }
        })
        .filter((data) => data !== null);

      setChartData(transformedData);
    }
  }, [histograms]);

  // ✅ 차트 페이징 관련 함수
  const totalPages = Math.ceil(chartData.length / CHARTS_PER_PAGE); // 전체 페이지 개수
  const displayedCharts = chartData.slice(
    currentPage * CHARTS_PER_PAGE,
    (currentPage + 1) * CHARTS_PER_PAGE
  ); // 현재 페이지 차트

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  const handleNextStep = () => {
    history.push(`/projects/${projectId}/flows/${flowId}/configure-properties`);
  };

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      {/* 상단 설명 및 Next Step 버튼 */}
      <Flex justifyContent="space-between" alignItems="center" mb={6} px={4}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Analyze Properties
          </Text>
          <Text fontSize="md" color="gray.400">
            Review and analyze the properties of your datasets to ensure they
            align with your objectives.
          </Text>
        </Box>
        <IconButton
          icon={<ArrowForwardIcon />}
          colorScheme="blue"
          aria-label="Next Step"
          onClick={handleNextStep}
        />
      </Flex>

      {/* 전체 레이아웃 */}
      <Grid templateColumns="1fr 3fr" h="calc(80vh - 50px)" gap={4}>
        {/* 왼쪽 - 작은 카드 2개 (데이터 개요 & 선택된 데이터셋) */}
        <Grid templateRows="1fr 1fr" gap={4}>
          {/* 데이터 개요 카드 */}
          <Card>
            <CardHeader>
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Dataset Overview
              </Text>
            </CardHeader>
            <Divider borderColor="#fff" mb={4} />
            <CardBody>
              <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                <Box p={3} bg="gray.700" borderRadius="lg" textAlign="center">
                  <Text fontSize="sm" color="gray.400">
                    Total Size
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {projectDatasets.reduce((sum, d) => sum + (d.size || 0), 0)}{" "}
                    MB
                  </Text>
                </Box>
                <Box p={3} bg="gray.700" borderRadius="lg" textAlign="center">
                  <Text fontSize="sm" color="gray.400">
                    Total Rows
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {Math.floor(Math.random() * 500000) + 10000}
                  </Text>
                </Box>
                <Box p={3} bg="gray.700" borderRadius="lg" textAlign="center">
                  <Text fontSize="sm" color="gray.400">
                    Available Properties
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {properties.numerical.length +
                      properties.categorical.length}{" "}
                    /{" "}
                    {properties.numerical.length +
                      properties.categorical.length +
                      properties.unavailable.length}
                  </Text>
                </Box>
              </Grid>
            </CardBody>
          </Card>

          {/* 선택된 데이터셋 카드 */}
          <Card>
            <CardHeader>
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Selected Datasets
              </Text>
            </CardHeader>
            <Divider borderColor="#fff" mb={4} />
            <CardBody>
              <SelectedDataArea
                selectedFiles={selectedDatasets}
                allDatasets={projectDatasets}
                onDeselect={() => {}}
              />
            </CardBody>
          </Card>
        </Grid>

        {/* 오른쪽 - 히스토그램 카드 */}
        <Card>
          <CardHeader display="flex" justifyContent="space-between">
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Data Properties Distribution
            </Text>
          </CardHeader>
          <Divider borderColor="#fff" mb={4} />
          {/* ✅ CardBody 내부를 relative로 설정하여 버튼 배치 */}
          <CardBody position="relative">
            {/* ✅ 좌우 이동 버튼을 Body 내부 중앙에 배치 */}
            <IconButton
              icon={<ArrowBackIcon />}
              size="sm"
              position="absolute"
              left="0"
              top="50%"
              bg="transparent"
              transform="translateY(-50%)"
              zIndex="10"
              isDisabled={currentPage === 0}
              onClick={handlePrevPage}
            />
            {/* ✅ 차트 영역 */}
            <Grid templateColumns="repeat(5, 1fr)" gap={1} w="100%">
              {displayedCharts.map(({ name, data, categories }, index) => (
                <Box key={index} textAlign="center">
                  <Text
                    color="gray.300"
                    fontWeight="bold"
                    mt={1}
                    mb={1}
                    textAlign="center"
                  >
                    {name}
                  </Text>
                  <BarChart
                    barChartData={[{ name, data }]}
                    barChartOptions={{
                      plotOptions: {},
                      xaxis: {
                        categories,
                        labels: {
                          style: { colors: "#fff", fontSize: "12px" },
                          minHeight: 60,
                          maxHeight: 60,
                          formatter: (val) => {
                            if (!isNaN(val)) {
                              return parseFloat(val).toFixed(4); // ✅ 소수점 4자리까지 표시
                            }
                            return val.length > 10
                              ? `${val.substring(0, 10)}...`
                              : val; // ✅ 문자열이면 생략 처리
                          },
                        },
                      },
                      chart: {
                        toolbar: {
                          show: false,
                        },
                      },
                    }}
                    width="70%"
                    height="450px"
                  />
                </Box>
              ))}
            </Grid>
            {/* ✅ 우측 이동 버튼 */}
            <IconButton
              icon={<ArrowForwardIcon />}
              size="sm"
              position="absolute"
              right="0"
              top="50%"
              bg="transparent"
              transform="translateY(-50%)"
              zIndex="10"
              isDisabled={currentPage === totalPages - 1}
              onClick={handleNextPage}
            />
          </CardBody>
        </Card>
      </Grid>
    </Flex>
  );
};

export default AnalyzePropertiesPage;
