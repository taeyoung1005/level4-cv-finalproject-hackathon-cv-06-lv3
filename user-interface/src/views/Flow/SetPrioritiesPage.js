// SetPrioritiesPage.jsx

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
  initializePriorities,
  fetchOptimizationData,
} from "store/features/flowSlice";
import { postOptimizationOrder } from "store/features/flowSlice";

const SetPrioritiesPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  const properties = useSelector(
    (state) => state.flows.newCategories[flowId] || {}
  );

  useEffect(() => {
    dispatch(fetchFlowProperties(flowId));
  }, [dispatch, flowId]);

  // controllable, output 속성에 대해서만 optimization data fetch
  useEffect(() => {
    Object.keys(properties).forEach((property) => {
      const type = properties[property];
      if (type === "controllable" || type === "output") {
        dispatch(fetchOptimizationData({ flowId, property, type }));
      }
    });
  }, [dispatch, flowId, properties]);

  const optimizationData = useSelector(
    (state) => state.flows.optimizationData[flowId] || {}
  );
  const storedPriorities = useSelector(
    (state) => state.flows.priorities[flowId] || []
  );

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

  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    if (storedPriorities.length > 0) {
      setPriorities(storedPriorities);
    }
  }, [storedPriorities]);

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

  useEffect(() => {
    dispatch(initializePriorities({ flowId }));
  }, [dispatch, flowId]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newPriorities = Array.from(priorities);
    const [movedItem] = newPriorities.splice(result.source.index, 1);
    newPriorities.splice(result.destination.index, 0, movedItem);
    setPriorities(newPriorities);
    dispatch(updatePriorities({ flowId, priorities: newPriorities }));
  };

  // 기존의 handleSavePriorities 함수는 그대로 유지하거나, 여기서 포함 가능
  const handleSavePriorities = () => {
    dispatch(updatePriorities({ flowId, priorities }));
  };

  // Next 버튼 클릭 시 우선순위 데이터를 API에 POST 후 다음 페이지로 이동
  const handleNextStep = async () => {
    try {
      await dispatch(postOptimizationOrder({ flowId, priorities })).unwrap();
      history.push(`/projects/${projectId}/flows/${flowId}/check-performance`);
    } catch (error) {
      console.error("Failed to post optimization orders:", error);
      // 에러 처리 로직 추가 가능 (예: toast 메시지 등)
    }
  };

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
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Set Priorities</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
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
