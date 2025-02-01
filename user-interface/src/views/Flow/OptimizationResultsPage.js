import React, { useEffect, useState } from "react";
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
  Button,
  HStack,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import {
  ArrowForwardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import Chart from "react-apexcharts";
import { fetchSearchResult } from "store/features/flowSlice"; // 실제 경로에 맞게 조정

const OptimizationResultsPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // 기존 flow, projectDatasets 상태
  const flow = useSelector((state) => state.flows.flows[flowId] || {});
  const projectDatasets = useSelector(
    (state) => state.projects.datasets[projectId] || []
  );

  // redux에 저장된 검색 결과 (searchResult는 flowId별 저장)
  const searchResult = useSelector((state) => state.flows.searchResult[flowId]);
  const error = useSelector((state) => state.flows.error);

  const [loading, setLoading] = useState(true);

  // 페이징 관련 state: 한 페이지에 보여줄 카드 수, 현재 페이지
  const pageSize = 4;
  const [currentPage, setCurrentPage] = useState(1);

  // 총 페이지 계산 (searchResult가 있을 경우)
  const totalPages = searchResult
    ? Math.ceil(searchResult.length / pageSize)
    : 0;

  // 현재 페이지에 해당하는 검색 결과 목록
  const currentResults = searchResult
    ? searchResult.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  useEffect(() => {
    if (!flowId) {
      console.error("Invalid flowId:", flowId);
      return;
    }
    // API 호출
    dispatch(fetchSearchResult(flowId))
      .unwrap()
      .catch((err) => console.error("Error fetching search result:", err))
      .finally(() => setLoading(false));
  }, [flowId, dispatch]);

  const handleNextStep = () => {
    history.push(`/projects/${projectId}/flows/${flowId}/optimization-results`);
  };

  // 페이징 버튼 핸들러
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // x축 label, tick 등을 감추도록 옵션 구성
  const baseChartOptions = {
    chart: {
      type: "line",
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
    },
    title: {
      align: "left",
      style: { color: "#fff" },
    },
    xaxis: {
      // 인덱스 대신 내부적으로 숫자 값으로 사용, 라벨 숨김
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#fff" } },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
    legend: {
      labels: { colors: "#fff" },
    },
    grid: {
      borderColor: "#444",
    },
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
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }} px={4}>
      {/* 상단 설명 및 Next Step 버튼 */}
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Optimization Results
          </Text>
          <Text fontSize="md" color="gray.400">
            Explore the optimization outcomes for each property.
          </Text>
        </Box>
        <IconButton
          icon={<ArrowForwardIcon />}
          colorScheme="blue"
          aria-label="Next Step"
          onClick={handleNextStep}
        />
      </Flex>

      {/* 전체 화면에 카드가 꽉 차도록 그리드 구성 - 페이징 */}
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
        {currentResults && currentResults.length > 0 ? (
          currentResults.map((item, index) => {
            // series 데이터 구성
            const series = [
              {
                name: "Ground Truth",
                data: item.ground_truth,
              },
              {
                name: "Predicted",
                data: item.predicted,
              },
            ];
            // 각 카드에 해당 프로퍼티에 대한 차트 옵션 적용 (타이틀만 변경)
            const options = {
              ...baseChartOptions,
              title: {
                text: `${item.column_name} Comparison`,
                align: "left",
                style: { color: "#fff" },
              },
            };

            return (
              <Card key={index} h="350px">
                <CardBody p={2} h="100%">
                  <Chart
                    options={options}
                    series={series}
                    type="line"
                    height="100%"
                    width="100%"
                  />
                </CardBody>
              </Card>
            );
          })
        ) : (
          <Text color="white" textAlign="center" width="100%">
            No optimization results available.
          </Text>
        )}
      </Grid>

      {/* 페이징 컨트롤 (화면 하단에 고정된 영역) */}
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
