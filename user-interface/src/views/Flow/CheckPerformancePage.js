import React, { useRef, useState, useEffect } from "react";
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
  Button,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import SelectedDataArea from "components/Card/SelectedDataArea";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const CheckPerformancePage = () => {
  const { projectId, flowId } = useParams(); // URL에서 flowId와 projectId를 가져옴
  const dispatch = useDispatch();
  const history = useHistory();

  const flow = useSelector((state) => state.flows.flows[flowId] || {});
  const projectDatasets = useSelector((state) => {
    return state.projects.datasets[projectId] || [];
  });

  useEffect(() => {
    if (!flowId) {
      console.error("Invalid flowId:", flowId);
    }
  }, [flowId]);

  const handleNextStep = () => {
    history.push(`/projects/${projectId}/flows/${flowId}/optimization-results`);
  };

  if (!flow) {
    return (
      <Flex pt={{ base: "120px", md: "75px" }} justify="center">
        <Text color="red.500">Flow not found</Text>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      {/* 상단 설명 및 Next Step 버튼 */}
      <Flex justifyContent="space-between" alignItems="center" mb={6} px={4}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Check Performance
          </Text>
          <Text fontSize="md" color="gray.400">
            Review the performance of your trained models and validate the
            results against predefined metrics.
          </Text>
        </Box>

        <IconButton
          icon={<ArrowForwardIcon />}
          colorScheme="blue"
          aria-label="Next Step"
          onClick={handleNextStep}
        />
      </Flex>

      <Grid templateColumns="1.8fr 1fr" h="calc(80vh - 50px)" gap={4}>
        {/* Properties 분석 카드 */}
        <Card w="100%">
          <CardHeader
            mb="16px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Dataset Properties
            </Text>
          </CardHeader>
          <Divider borderColor="#fff" mb={4} />
          <CardBody h="100%" display="flex" flexDirection="column" gap={4}>
            <Box
              flex="2"
              overflowY="auto"
              w="100%"
              css={{
                "&::-webkit-scrollbar": {
                  width: "0px",
                },
              }}
            >
              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                gap={4}
                w="100%"
              >
                {projectDatasets.map((dataset) => (
                  <Box
                    key={dataset.id}
                    bg="gray.700"
                    p={4}
                    borderRadius="lg"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                    transition="all 0.3s"
                    _hover={{
                      transform: "scale(1.02)",
                      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <Text fontSize="lg" fontWeight="bold" color="white">
                      {dataset.name}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Type: {dataset.type}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Size: {dataset.size} MB
                    </Text>
                  </Box>
                ))}
              </Grid>
            </Box>
          </CardBody>
        </Card>

        {/* 선택된 데이터셋 카드 */}
        <Grid templateRows="1.5fr 1fr" gap={4}>
          <Card>
            <CardHeader mb="16px">
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Selected Data
              </Text>
            </CardHeader>
            <Divider borderColor="#fff" mb={4} />
            <CardBody>
              <SelectedDataArea
                selectedFiles={projectDatasets.filter((dataset) =>
                  flow.datasets?.includes(dataset.id)
                )}
                onDeselect={(dataset) => {
                  const updatedDatasetIds = flow.datasets.filter(
                    (id) => id !== dataset.id
                  );
                  dispatch(
                    updateFlowDatasets({
                      flowId,
                      datasetIds: updatedDatasetIds,
                    })
                  );
                }}
              />
            </CardBody>
          </Card>
        </Grid>
      </Grid>
    </Flex>
  );
};

export default CheckPerformancePage;
