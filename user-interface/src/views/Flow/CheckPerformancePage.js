import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  Grid,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
} from "@chakra-ui/react";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import Chart from "react-apexcharts";
import { ArrowForwardIcon, ArrowBackIcon } from "@chakra-ui/icons";
import {
  fetchSurrogateFeatureImportance,
  fetchSurrogateMatric,
  fetchSurrogateResult,
} from "store/features/flowSlice";

const SurrogatePerformancePage = () => {
  const { flowId, projectId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // Redux: surrogate data
  const featureImportance = useSelector(
    (state) => state.flows.surrogateFeatureImportance[flowId] || []
  );
  const surrogateMatric = useSelector(
    (state) => state.flows.surrogateMatric[flowId] || []
  );
  const surrogateResult = useSelector(
    (state) => state.flows.surrogateResult[flowId] || []
  );

  // Fetch surrogate data on mount
  useEffect(() => {
    dispatch(fetchSurrogateFeatureImportance(flowId));
    dispatch(fetchSurrogateMatric(flowId));
    dispatch(fetchSurrogateResult(flowId));
  }, [dispatch, flowId]);

  // Best and Worst cases computed from surrogateResult.
  // 가정: lower rank 값이 더 좋은 경우
  const sortedResults = useMemo(() => {
    return surrogateResult.slice().sort((a, b) => a.rank - b.rank);
  }, [surrogateResult]);

  const bestCases = useMemo(() => {
    return sortedResults.slice(0, 5);
  }, [sortedResults]);

  const worstCases = useMemo(() => {
    return sortedResults.slice(-5);
  }, [sortedResults]);

  // ApexChart configuration for Feature Importance (Bar Chart)
  const featureImportanceOptions = useMemo(() => {
    return {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: {
        bar: { distributed: true, horizontal: false },
      },
      xaxis: {
        categories: featureImportance.map((fi) => fi.column),
        labels: {
          style: {
            colors: featureImportance.map(() => "#fff"),
            fontSize: "12px",
          },
        },
      },
      yaxis: { labels: { style: { colors: "#fff", fontSize: "12px" } } },
      colors: featureImportance.map(() => "#4A90E2"),
      dataLabels: { enabled: false },
      tooltip: { theme: "dark" },
    };
  }, [featureImportance]);

  const featureImportanceSeries = useMemo(() => {
    return [
      {
        name: "Importance",
        data: featureImportance.map((fi) => fi.importance),
      },
    ];
  }, [featureImportance]);

  // Helper: 카드 배경색 결정 based on optimization goal
  // (예시 매핑: No Optimization: gray, Maximize: green, Minimize: red, Fit to Range: orange, Fit to Property: purple)
  const getGoalColor = (goal) => {
    switch (goal) {
      case "No Optimization":
        return "gray.600";
      case "Maximize":
        return "green.500";
      case "Minimize":
        return "red.500";
      case "Fit to Range":
        return "orange.500";
      case "Fit to Property":
        return "purple.500";
      default:
        return "gray.600";
    }
  };

  // UI 구성
  return (
    <Flex direction="column" p={6} bg="gray.900" minH="100vh" color="white">
      {/* 헤더 */}
      <Card bg="gray.800" p={4} borderRadius="md" mb={6} boxShadow="md">
        <CardHeader>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Surrogate Model Performance
          </Text>
        </CardHeader>
      </Card>

      {/* 탭 영역 */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Feature Importance</Tab>
          <Tab>Metrics & Results</Tab>
        </TabList>
        <TabPanels>
          {/* Feature Importance 탭 */}
          <TabPanel>
            <Card bg="gray.800" p={4} borderRadius="md" boxShadow="md">
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">
                  Feature Importance
                </Text>
              </CardHeader>
              <Divider borderColor="gray.600" my={2} />
              <CardBody>
                {featureImportance.length > 0 ? (
                  <Chart
                    options={featureImportanceOptions}
                    series={featureImportanceSeries}
                    type="bar"
                    height="400"
                  />
                ) : (
                  <Text>No feature importance data available</Text>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Metrics & Results 탭 */}
          <TabPanel>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              {/* Surrogate Metrics Card */}
              <Card bg="gray.800" p={4} borderRadius="md" boxShadow="md">
                <CardHeader>
                  <Text fontSize="xl" fontWeight="bold">
                    Surrogate Metrics
                  </Text>
                </CardHeader>
                <Divider borderColor="gray.600" my={2} />
                <CardBody>
                  {surrogateMatric.length > 0 ? (
                    // surrogateMatric is assumed to be an array with one element
                    <>
                      <Text fontSize="lg">
                        R-squared: {surrogateMatric[0].r_squared}
                      </Text>
                      <Text fontSize="lg">RMSE: {surrogateMatric[0].rmse}</Text>
                    </>
                  ) : (
                    <Text>No metrics available</Text>
                  )}
                </CardBody>
              </Card>

              {/* Surrogate Results Card */}
              <Card bg="gray.800" p={4} borderRadius="md" boxShadow="md">
                <CardHeader>
                  <Text fontSize="xl" fontWeight="bold">
                    Surrogate Results
                  </Text>
                </CardHeader>
                <Divider borderColor="gray.600" my={2} />
                <CardBody>
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={4}
                  >
                    {/* Best Cases */}
                    <Card bg="gray.700" p={3} borderRadius="md" boxShadow="sm">
                      <CardHeader>
                        <Text fontSize="lg" fontWeight="bold">
                          Best Cases
                        </Text>
                      </CardHeader>
                      <Divider borderColor="gray.600" my={1} />
                      <CardBody>
                        {bestCases.length > 0 ? (
                          bestCases.map((res) => (
                            <Box
                              key={res.id}
                              p={2}
                              borderBottom="1px solid gray"
                              mb={1}
                            >
                              <Text fontSize="sm">
                                GT: {res.ground_truth} | Predicted:{" "}
                                {res.predicted}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                Rank: {res.rank}
                              </Text>
                            </Box>
                          ))
                        ) : (
                          <Text>No best cases available</Text>
                        )}
                      </CardBody>
                    </Card>
                    {/* Worst Cases */}
                    <Card bg="gray.700" p={3} borderRadius="md" boxShadow="sm">
                      <CardHeader>
                        <Text fontSize="lg" fontWeight="bold">
                          Worst Cases
                        </Text>
                      </CardHeader>
                      <Divider borderColor="gray.600" my={1} />
                      <CardBody>
                        {worstCases.length > 0 ? (
                          worstCases.map((res) => (
                            <Box
                              key={res.id}
                              p={2}
                              borderBottom="1px solid gray"
                              mb={1}
                            >
                              <Text fontSize="sm">
                                GT: {res.ground_truth} | Predicted:{" "}
                                {res.predicted}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                Rank: {res.rank}
                              </Text>
                            </Box>
                          ))
                        ) : (
                          <Text>No worst cases available</Text>
                        )}
                      </CardBody>
                    </Card>
                  </Grid>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* 하단 버튼 영역 */}
      <Flex justify="center" mt={6}>
        <Button
          colorScheme="blue"
          onClick={() =>
            history.push(
              `/projects/${projectId}/flows/${flowId}/optimization-results`
            )
          }
        >
          View Detailed Optimization Results
        </Button>
      </Flex>
    </Flex>
  );
};

export default SurrogatePerformancePage;
