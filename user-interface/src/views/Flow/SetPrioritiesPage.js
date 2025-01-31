import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { Box, Flex, Text, Button, Grid, Divider } from "@chakra-ui/react";
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

const SetPrioritiesPage = () => {
  const { flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // ✅ 최적화 데이터 로드
  const optimizationData = useSelector(
    (state) => state.flows.optimizationData[flowId] || {}
  );

  // ✅ 우선순위 데이터 로드
  const storedPriorities = useSelector(
    (state) => state.flows.priorities[flowId] || []
  );

  // ✅ 디버깅 추가
  console.log("Redux optimizationData:", optimizationData);
  console.log("Redux priorities:", storedPriorities);

  // ✅ 상태: Drag & Drop을 위한 로컬 우선순위 관리
  const [priorities, setPriorities] = useState(storedPriorities);

  // ✅ Flow 속성 불러오기
  useEffect(() => {
    if (priorities.length === 0 && Object.keys(optimizationData).length > 0) {
      // ✅ 초기 데이터 생성 (controllable + output 속성을 모두 포함)
      const defaultPriorities = [
        ...controllableProperties,
        ...outputProperties,
      ];
      setPriorities(defaultPriorities);
    }
  }, [optimizationData, priorities.length]);

  useEffect(() => {
    dispatch(initializePriorities({ flowId }));
  }, [dispatch, flowId]);

  // ✅ 최적화 속성 분류 (Controllable vs Output)
  const controllableProperties = Object.entries(optimizationData)
    .filter(([_, value]) => value.type === "controllable")
    .map(([key]) => key);

  const outputProperties = Object.entries(optimizationData)
    .filter(([_, value]) => value.type === "output")
    .map(([key]) => key);

  // ✅ Drag & Drop 이벤트 핸들러
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newPriorities = [...priorities];
    const [movedItem] = newPriorities.splice(result.source.index, 1);
    newPriorities.splice(result.destination.index, 0, movedItem);

    setPriorities(newPriorities); // ✅ UI 업데이트
    dispatch(updatePriorities({ flowId, priorities: newPriorities })); // ✅ Redux 상태 업데이트
  };

  // ✅ 우선순위 저장
  const handleSavePriorities = () => {
    dispatch(updatePriorities({ flowId, priorities }));
  };

  // ✅ 다음 단계로 이동
  const handleNextStep = () => {
    handleSavePriorities();
    history.push(`/projects/flows/${flowId}/check-performance`);
  };

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }} px={6}>
      {/* 상단 설명 및 네비게이션 버튼 */}
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

      {/* 최적화 속성 표시 */}
      <Grid templateColumns="1fr 1fr" gap={6}>
        {/* Controllable Properties */}
        <Card>
          <CardHeader>
            <Text fontSize="lg" fontWeight="bold" color="white">
              Controllable Properties
            </Text>
          </CardHeader>
          <Divider borderColor="gray.600" />
          <CardBody>
            {controllableProperties.length > 0 ? (
              controllableProperties.map((prop) => (
                <Box key={prop} p={3} bg="gray.700" borderRadius="md" mb={2}>
                  <Text color="white">
                    {prop} ({optimizationData[prop].goal})
                  </Text>
                </Box>
              ))
            ) : (
              <Text color="gray.400">No controllable properties</Text>
            )}
          </CardBody>
        </Card>

        {/* Output Properties */}
        <Card>
          <CardHeader>
            <Text fontSize="lg" fontWeight="bold" color="white">
              Output Properties
            </Text>
          </CardHeader>
          <Divider borderColor="gray.600" />
          <CardBody>
            {outputProperties.length > 0 ? (
              outputProperties.map((prop) => (
                <Box key={prop} p={3} bg="gray.700" borderRadius="md" mb={2}>
                  <Text color="white">
                    {prop} ({optimizationData[prop].goal})
                  </Text>
                </Box>
              ))
            ) : (
              <Text color="gray.400">No output properties</Text>
            )}
          </CardBody>
        </Card>
      </Grid>

      {/* 우선순위 설정 */}
      <Card mt={6}>
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
                <Box ref={provided.innerRef} {...provided.droppableProps} p={3}>
                  {priorities.map((prop, index) => (
                    <Draggable key={prop} draggableId={prop} index={index}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          p={3}
                          mb={2}
                          bg={snapshot.isDragging ? "blue.600" : "gray.700"}
                          borderRadius="md"
                          color="white"
                          fontWeight="bold"
                        >
                          {prop}
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </CardBody>
      </Card>

      {/* 우선순위 저장 버튼 */}
      <Flex justifyContent="center" mt={6}>
        <Button colorScheme="green" onClick={handleSavePriorities}>
          Save Priorities
        </Button>
      </Flex>
    </Flex>
  );
};

export default SetPrioritiesPage;
