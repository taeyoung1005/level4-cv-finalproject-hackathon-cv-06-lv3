import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Box,
  Flex,
  Grid,
  IconButton,
  Divider,
  Text,
  Button,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  fetchFlowProperties,
  savePropertyCategories,
  updateCategory,
} from "store/features/flowSlice";

const ConfigurePropertiesPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  // ✅ 기존 numerical, categorical, unavailable 데이터 유지
  const properties = useSelector(
    (state) =>
      state.flows.properties?.[flowId] || {
        numerical: [],
        categorical: [],
        unavailable: [],
      }
  );

  // ✅ 새로운 environmental, controllable, output 카테고리 저장
  const newCategories = useSelector(
    (state) => state.flows.newCategories?.[flowId] || {}
  );

  const [datasetProperties, setDatasetProperties] = useState({
    numerical: [],
    categorical: [],
    unavailable: [],
  });

  const [categorizedProperties, setCategorizedProperties] = useState({
    environmental: [],
    controllable: [],
    output: [],
  });

  useEffect(() => {
    dispatch(fetchFlowProperties(flowId));
  }, [dispatch, flowId]);

  useEffect(() => {
    // ✅ 기존 properties에서 newCategories에 포함되지 않은 속성만 유지
    const updatedDatasetProperties = {
      numerical: properties.numerical.filter((p) => !newCategories[p]),
      categorical: properties.categorical.filter((p) => !newCategories[p]),
      unavailable: properties.unavailable.filter((p) => !newCategories[p]),
    };

    // ✅ 기존 categorizedProperties와 비교 후 변경 사항이 있을 때만 업데이트
    setDatasetProperties((prev) =>
      JSON.stringify(prev) !== JSON.stringify(updatedDatasetProperties)
        ? updatedDatasetProperties
        : prev
    );

    const updatedCategorizedProperties = {
      environmental: Object.keys(newCategories).filter(
        (p) => newCategories[p] === "environmental"
      ),
      controllable: Object.keys(newCategories).filter(
        (p) => newCategories[p] === "controllable"
      ),
      output: Object.keys(newCategories).filter(
        (p) => newCategories[p] === "output"
      ),
    };

    setCategorizedProperties((prev) =>
      JSON.stringify(prev) !== JSON.stringify(updatedCategorizedProperties)
        ? updatedCategorizedProperties
        : prev
    );
  }, [properties, JSON.stringify(newCategories)]); // ✅ `JSON.stringify(newCategories)`를 활용해 의존성 변경 감지

  /**
   * ✅ Drag & Drop 후 새로운 category 추가
   */
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    let movedItem = null;

    // ✅ 왼쪽 카드에서 이동할 경우 (numerical, categorical, unavailable → 오른쪽)
    if (datasetProperties[sourceId]) {
      const newSourceList = [...datasetProperties[sourceId]];
      movedItem = newSourceList.splice(source.index, 1)[0];

      setDatasetProperties((prev) => ({
        ...prev,
        [sourceId]: newSourceList,
      }));
    }
    // ✅ 오른쪽 카드 간 이동 (environmental ↔ controllable ↔ output)
    else if (categorizedProperties[sourceId]) {
      const newSourceList = [...categorizedProperties[sourceId]];
      movedItem = newSourceList.splice(source.index, 1)[0];

      setCategorizedProperties((prev) => ({
        ...prev,
        [sourceId]: newSourceList,
      }));
    }

    if (!movedItem) return;

    // ✅ Redux 상태 업데이트 (이동된 property의 카테고리 변경)
    dispatch(updateCategory({ flowId, property: movedItem, category: destId }));

    // ✅ 새로운 카테고리로 이동
    setCategorizedProperties((prev) => ({
      ...prev,
      [destId]: [...prev[destId], movedItem],
    }));
  };

  /**
   * ✅ Next Step 버튼 클릭 시 새로운 category만 API 요청
   */
  const handleNextStep = async () => {
    const updates = Object.keys(newCategories).map((property) => ({
      flow_id: parseInt(flowId),
      column_name: property,
      property_type: newCategories[property],
    }));

    console.log(updates);

    updates.forEach((update) => {
      console.log(update);
      return dispatch(savePropertyCategories({ flowId, update }));
    });

    history.push(`/projects/${projectId}/flows/${flowId}/set-goals`);
  };

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      <Flex justifyContent="space-between" alignItems="center" mb={6} px={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Configure Properties
          </Text>
          <Text fontSize="md" color="gray.400">
            Drag and drop properties into appropriate categories.
          </Text>
        </Box>
        <IconButton
          icon={<ArrowForwardIcon />}
          colorScheme="blue"
          aria-label="Next Step"
          onClick={handleNextStep}
        />
      </Flex>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid templateColumns="1fr 2fr" h="calc(80vh - 50px)" gap={6} px={6}>
          {/* ✅ 기존 속성 (numerical, categorical, unavailable) */}
          <Card>
            <CardHeader>
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Dataset Properties
              </Text>
            </CardHeader>
            <Divider borderColor="#fff" mb={4} />
            <CardBody>
              {Object.keys(datasetProperties).map((category) => (
                <Droppable key={category} droppableId={category}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      p={4}
                      mb={4}
                      bg="gray.800"
                      borderRadius="lg"
                      boxShadow="lg"
                    >
                      <Text color="gray.300" fontWeight="bold" mb={2}>
                        {category.toUpperCase()}
                      </Text>
                      {datasetProperties[category]?.map((prop, index) => (
                        <Draggable key={prop} draggableId={prop} index={index}>
                          {(provided, snapshot) => {
                            const child = (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                p={3}
                                bg="blue.500"
                                borderRadius="md"
                                color="white"
                                fontWeight="bold"
                                textAlign="center"
                                mb={2}
                                zIndex={snapshot.isDragging ? 1000 : "auto"}
                                position={
                                  snapshot.isDragging ? "fixed" : "relative"
                                }
                                left={
                                  snapshot.isDragging
                                    ? `${provided.draggableProps.style.left}px`
                                    : "auto"
                                }
                                top={
                                  snapshot.isDragging
                                    ? `${provided.draggableProps.style.top}px`
                                    : "auto"
                                }
                              >
                                {prop}
                              </Box>
                            );
                            return snapshot.isDragging
                              ? createPortal(child, document.body)
                              : child;
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              ))}
            </CardBody>
          </Card>

          {/* ✅ 새로운 카테고리 (environmental, controllable, output) */}
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            {Object.keys(categorizedProperties).map((category) => (
              <Card key={category}>
                <CardHeader>
                  <Text color="#fff" fontSize="lg" fontWeight="bold">
                    {category.charAt(0).toUpperCase() + category.slice(1)}{" "}
                    Properties
                  </Text>
                </CardHeader>
                <Divider borderColor="#fff" mb={4} />
                <CardBody>
                  <Droppable droppableId={category}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        p={4}
                        minH="600px"
                        minW="100%"
                        bg="transparent"
                        borderRadius="lg"
                        border="1px dashed #fff"
                        boxShadow="lg"
                      >
                        {categorizedProperties[category]?.map((prop, index) => (
                          <Draggable
                            key={prop}
                            draggableId={prop}
                            index={index}
                          >
                            {(provided, snapshot) => {
                              const child = (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  p={3}
                                  bg="green.500"
                                  borderRadius="md"
                                  color="white"
                                  fontWeight="bold"
                                  textAlign="center"
                                  mb={2}
                                  zIndex={snapshot.isDragging ? 1000 : "auto"}
                                  position={
                                    snapshot.isDragging ? "fixed" : "relative"
                                  }
                                >
                                  {prop}
                                </Box>
                              );
                              return snapshot.isDragging
                                ? createPortal(child, document.body)
                                : child;
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Grid>
      </DragDropContext>
    </Flex>
  );
};

export default ConfigurePropertiesPage;
