import React, { useEffect, useState } from "react";
import { Flex, Grid, Box, Text, Spinner, useToast } from "@chakra-ui/react";
import { CheckIcon, TimeIcon } from "@chakra-ui/icons";
import Card from "components/Card/Card";
import CardHeader from "components/Card/CardHeader";
import CardBody from "components/Card/CardBody";
import axios from "axios";

const trainingStages = [
  { id: 1, label: "Preprocessing Start" },
  { id: 2, label: "Preprocessing Complete" },
  { id: 3, label: "Surrogate Model Training Start" },
  { id: 4, label: "Surrogate Model Training Complete" },
  { id: 5, label: "Search Model Optimization Start" },
  { id: 6, label: "Search Model Optimization Complete" },
];

const ModelTrainingProgressPage = () => {
  // currentStage: API에서 받아온 현재 진행 단계 (예: 1 ~ 6)
  const [currentStage, setCurrentStage] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // 예시: flowId를 URL에서 받아온다고 가정 (필요에 따라 사용)
  // const { flowId } = useParams();

  // API 폴링: 일정 간격마다 진행 상태 업데이트 (예: 3초마다)
  useEffect(() => {
    // const intervalId = setInterval(async () => {
    //   try {
    //     // 실제 API 엔드포인트와 응답 구조에 맞게 수정하세요.
    //     const response = await axios.get(`/api/flow/progress?flowId=123`);
    //     // 응답 데이터 예시: { stage: 3 }  (1 ~ 6 사이의 숫자)
    //     const stage = response.data.stage;
    //     setCurrentStage(stage);
    //     setLoading(false);
    //   } catch (error) {
    //     console.error("Failed to fetch progress:", error);
    //     toast({
    //       title: "Error fetching progress",
    //       description: error.message,
    //       status: "error",
    //       duration: 3000,
    //       isClosable: true,
    //     });
    //   }
    // }, 3000);
    // return () => clearInterval(intervalId);
  }, [toast]);

  return (
    <Flex
      direction="column"
      p={6}
      minH="80vh"
      pt={{ base: "120px", md: "75px" }}
    >
      <Card>
        <CardHeader>
          <Text color="white" fontSize="2xl" fontWeight="bold">
            Model Training Progress
          </Text>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Flex justify="center" align="center">
              <Spinner color="white" size="xl" />
            </Flex>
          ) : (
            <Grid templateColumns="repeat(6, 1fr)" gap={4}>
              {trainingStages.map((stage) => (
                <Box
                  key={stage.id}
                  p={3}
                  borderRadius="md"
                  bg={
                    currentStage > stage.id
                      ? "green.500"
                      : currentStage === stage.id
                      ? "yellow.400"
                      : "gray.700"
                  }
                  textAlign="center"
                >
                  <Text color="white" fontSize="sm">
                    {stage.label}
                  </Text>
                  <Box mt={2}>
                    {currentStage > stage.id ? (
                      <CheckIcon boxSize={6} color="white" />
                    ) : currentStage === stage.id ? (
                      <TimeIcon boxSize={6} color="white" />
                    ) : null}
                  </Box>
                </Box>
              ))}
            </Grid>
          )}
        </CardBody>
      </Card>
    </Flex>
  );
};

export default ModelTrainingProgressPage;
