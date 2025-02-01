import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ArrowForwardIcon, ArrowBackIcon } from "@chakra-ui/icons";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import {
  fetchFlowProperties,
  updatePriorities,
} from "store/features/flowSlice";
import { initializePriorities } from "store/features/flowSlice";
import { fetchOptimizationData } from "store/features/flowSlice";

const SetPrioritiesPage = () => {
  const { flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // Redux: newCategories (property -> category)
  const properties = useSelector(
    (state) => state.flows.newCategories[flowId] || {}
  );

  // 컴포넌트 마운트 시 한 번만 Flow Properties fetch
  useEffect(() => {
    dispatch(fetchFlowProperties(flowId));
  }, [dispatch, flowId]);

  // properties 업데이트 시 각 property에 대해 최적화 데이터 fetch
  useEffect(() => {
    Object.keys(properties).forEach((property) => {
      const type = properties[property]; // "controllable", "output", etc.
      dispatch(fetchOptimizationData({ flowId, property, type }));
    });
  }, [dispatch, flowId, properties]);

  // Redux: optimizationData
  const optimizationData = useSelector(
    (state) => state.flows.optimizationData[flowId] || {}
  );

  // Redux: storedPriorities
  const storedPriorities = useSelector(
    (state) => state.flows.priorities[flowId] || []
  );

  // useMemo: controllableProperties와 outputProperties (안정화)
  const controllableProperties = useMemo(() => {
    return Object.entries(properties)
      .filter(([_, cat]) => cat === "controllable")
      .map(([prop]) => prop);
  }, [properties]);

  const outputProperties = useMemo(() => {
    return Object.entries(properties)
      .filter(([_, cat]) => cat === "output")
      .map(([prop]) => prop);
  }, [properties]);

  // Local state: 우선순위 배열. 초기값은 빈 배열.
  const [priorities, setPriorities] = useState([]);

  // 만약 Redux의 storedPriorities가 있다면 local state에 반영
  useEffect(() => {
    if (storedPriorities.length > 0) {
      setPriorities(storedPriorities);
    }
  }, [storedPriorities]);

  // 우선순위 초기화: 만약 local priorities가 비어있고, optimizationData가 준비되었으면 default 우선순위를 설정
  const initializedRef = useRef(false);
  useEffect(() => {
    if (
      !initializedRef.current &&
      priorities.length === 0 &&
      Object.keys(optimizationData).length > 0
    ) {
      const defaultPriorities = [
        ...controllableProperties,
        ...outputProperties,
      ];
      setPriorities(defaultPriorities);
      initializedRef.current = true;
    }
  }, [
    optimizationData,
    priorities.length,
    controllableProperties,
    outputProperties,
  ]);

  // Redux 우선순위 초기화 액션은 한 번만 실행
  useEffect(() => {
    dispatch(initializePriorities({ flowId }));
  }, [dispatch, flowId]);

  // Drag & Drop 이벤트 핸들러
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newPriorities = Array.from(priorities);
    const [movedItem] = newPriorities.splice(result.source.index, 1);
    newPriorities.splice(result.destination.index, 0, movedItem);
    setPriorities(newPriorities);
    dispatch(updatePriorities({ flowId, priorities: newPriorities }));
  };

  const handleSavePriorities = () => {
    dispatch(updatePriorities({ flowId, priorities }));
  };

  const handleNextStep = () => {
    handleSavePriorities();
    history.push(`/projects/flows/${flowId}/check-performance`);
  };

  // Helper: 목표(goal)에 따라 카드 배경색 결정
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

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }} px={6}>
      {/* 상단 네비게이션 */}
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Button leftIcon={<ArrowBackIcon />} onClick={() => history.goBack()}>
          Back
        </Button>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Set Priorities
        </Text>
        <Button
          rightIcon={<ArrowForwardIcon />}
          colorScheme="blue"
          onClick={handleNextStep}
        >
          Next
        </Button>
      </Flex>

      {/* 탭 구성: Overview & Set Priorities */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Set Priorities</Tab>
        </TabList>
        <TabPanels>
          {/* Overview 탭 */}
          <TabPanel>
            {/* 전체 Overview 컨테이너 */}
            <Card bg="gray.800" p={4} borderRadius="md">
              <VStack spacing={3} align="stretch">
                {Object.keys(optimizationData).length > 0 ? (
                  Object.keys(optimizationData).map((prop) => {
                    const data = optimizationData[prop];
                    const bgColor = getGoalColor(data.goal);
                    return (
                      <Card key={prop} bg={bgColor} p={2} borderRadius="md">
                        <CardHeader p={1}>
                          <Text fontSize="sm" fontWeight="bold" color="white">
                            {prop}
                          </Text>
                        </CardHeader>
                        <Divider borderColor="whiteAlpha.600" />
                        <CardBody p={1}>
                          <Text fontSize="xs" color="white">
                            Range: {data.minimum_value} ~ {data.maximum_value}
                          </Text>
                          <Text fontSize="xs" color="white">
                            Optimization Goal: {data.goal}
                          </Text>
                        </CardBody>
                      </Card>
                    );
                  })
                ) : (
                  <Text color="gray.400">No optimization data available</Text>
                )}
              </VStack>
            </Card>
          </TabPanel>

          {/* Set Priorities 탭 */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="lg" fontWeight="bold" color="white">
                  Prioritize Optimization Goals
                </Text>
              </CardHeader>
              <Divider borderColor="gray.600" />
              <CardBody>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="priorities">
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        p={3}
                      >
                        <VStack spacing={3} align="stretch">
                          {priorities.map((prop, index) => {
                            const data = optimizationData[prop] || {};
                            const bgColor = getGoalColor(data.goal);
                            return (
                              <Draggable
                                key={prop}
                                draggableId={prop}
                                index={index}
                              >
                                {(provided, snapshot) => {
                                  const child = (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      bg={
                                        snapshot.isDragging
                                          ? "blue.600"
                                          : bgColor
                                      }
                                      p={2}
                                      borderRadius="md"
                                    >
                                      <CardHeader p={1}>
                                        <Flex align="center">
                                          <Badge mr={2} colorScheme="teal">
                                            {index + 1}
                                          </Badge>
                                          <Text
                                            fontSize="sm"
                                            fontWeight="bold"
                                            color="white"
                                          >
                                            {prop}
                                          </Text>
                                        </Flex>
                                      </CardHeader>
                                      <CardBody p={1}>
                                        <Text fontSize="xs" color="white">
                                          Goal: {data.goal || "-"}
                                        </Text>
                                      </CardBody>
                                    </Card>
                                  );
                                  return snapshot.isDragging
                                    ? createPortal(child, document.body)
                                    : child;
                                }}
                              </Draggable>
                            );
                          })}
                        </VStack>
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardBody>
            </Card>
            <Flex justifyContent="center" mt={6}>
              <Button colorScheme="green" onClick={handleSavePriorities}>
                Save Priorities
              </Button>
            </Flex>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default SetPrioritiesPage;
