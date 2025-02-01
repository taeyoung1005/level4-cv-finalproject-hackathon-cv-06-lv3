import React, { useRef, useEffect, useState } from "react";
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
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import SelectedDataArea from "components/Card/SelectedDataArea";
import DragAndDropArea from "components/DragAndDropArea/DragAndDropArea";
import ProjectFileRow from "components/Tables/ProjectFileRows";

import { addCsvToFlow, fetchFlowDatasets } from "store/features/flowSlice";
import {
  uploadCsvFile,
  deleteCsvFile,
  fetchCsvFilesByProject,
} from "store/features/projectSlice";
import { ArrowForwardIcon, AttachmentIcon, CheckIcon } from "@chakra-ui/icons";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { fetchFlowProperties } from "store/features/flowSlice";

const SelectDatasetsPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();
  const fileInputRef = useRef(null);
  const isMounted = useRef(true); // ✅ 컴포넌트 마운트 여부 확인

  const [isLoading, setIsLoading] = useState(true);
  // ✅ 선택된 데이터셋을 로컬 상태에서 관리
  const [selectedDatasets, setSelectedDatasets] = useState([]);

  const reduxState = useSelector((state) => state);

  useEffect(() => {
    console.log("SelectDatasetsPage Redux state:", reduxState);
  }, [reduxState]);

  // ✅ Flow와 프로젝트의 CSV 데이터셋 불러오기
  useEffect(() => {
    let isMounted = true; // ✅ 컴포넌트 마운트 여부 확인

    const fetchData = async () => {
      try {
        await dispatch(fetchCsvFilesByProject(projectId));
        const res = await dispatch(fetchFlowDatasets(flowId)).unwrap();
        await dispatch(fetchFlowProperties(flowId));
        if (isMounted) {
          setSelectedDatasets(res.datasets?.map((d) => d.csvId) || []);
        }
      } catch (error) {
        console.error("❌ Failed to fetch flow datasets:", error);
        if (isMounted) setSelectedDatasets([]);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // ✅ 언마운트 시 상태 업데이트 방지
    };
  }, [dispatch, projectId, flowId]);

  // Redux 상태에서 데이터 가져오기
  const flow = useSelector((state) => state.flows.flows[flowId] || {});
  const properties = useSelector(
    (state) =>
      state.flows.properties?.[flowId] || {
        numerical: [],
        categorical: [],
        unavailable: [],
      }
  );

  const projectDatasets = useSelector(
    (state) => state.projects.datasets[projectId] || []
  );

  const handleNextStep = () => {
    history.push(`/projects/${projectId}/flows/${flowId}/analyze-properties`);
  };

  // ✅ 데이터셋 선택
  const handleDatasetSelect = (csvId) => {
    setSelectedDatasets((prev) => [...prev, csvId]);
  };

  // ✅ 데이터셋 선택 해제
  const handleDatasetDeselect = (csvId) => {
    setSelectedDatasets((prev) => prev.filter((id) => id !== csvId));
  };

  // ✅ 파일 업로드 클릭 핸들러
  const handleHeaderUploadClick = () => {
    fileInputRef.current.click();
  };

  // ✅ 파일 업로드 핸들러
  const handleFilesAdded = async (files) => {
    const allowedFormats = ["text/csv"];
    const fileArray = Array.from(files);

    const validFiles = fileArray.filter((file) => {
      if (!allowedFormats.includes(file.type)) {
        alert(
          `${file.name} is not a valid format. Only CSV files are allowed.`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const uploadResults = await Promise.allSettled(
      validFiles.map((file) =>
        dispatch(uploadCsvFile({ projectId, file, writer: "admin" }))
      )
    );

    uploadResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`File uploaded successfully: ${validFiles[index].name}`);
      } else {
        console.error(
          `Failed to upload file: ${validFiles[index].name}`,
          result.reason
        );
      }
    });

    dispatch(fetchCsvFilesByProject(projectId));
  };

  // ✅ 데이터셋 삭제 핸들러
  const handleFileDelete = async (csvId) => {
    try {
      await dispatch(deleteCsvFile({ projectId, csvId })).unwrap();
      dispatch(fetchCsvFilesByProject(projectId));
    } catch (error) {
      console.error(`Failed to delete dataset ${csvId}:`, error);
    }
  };

  // ✅ Flow에 선택된 데이터셋 저장
  const handleApplySelection = async () => {
    await dispatch(addCsvToFlow({ flowId, csvIds: selectedDatasets }));
    await dispatch(fetchFlowProperties(flowId));
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
      <Flex justifyContent="space-between" alignItems="center" mb={6} px={4}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Select Datasets
          </Text>
          <Text fontSize="md" color="gray.400">
            Please select the datasets you want to analyze. You can upload new
            datasets or choose from the existing ones.
          </Text>
        </Box>

        <IconButton
          icon={<ArrowForwardIcon />}
          colorScheme="red"
          aria-label="Next Step"
          onClick={handleNextStep}
        />
      </Flex>
      <Grid templateColumns="1.8fr 1fr" h="calc(80vh - 50px)" gap={4}>
        <Card w="100%">
          <CardHeader
            display="flex"
            justifyContent="space-between"
            mb="16px"
            alignItems="center"
          >
            <Text color="#fff" fontSize="lg" fontWeight="bold">
              Project Files
            </Text>
            <Flex gap={2}>
              <Tooltip label="Upload Files">
                <IconButton
                  size="sm"
                  bg="brand.100"
                  icon={<AttachmentIcon h="20px" w="20px" color="#fff" />}
                  onClick={handleHeaderUploadClick}
                />
              </Tooltip>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => handleFilesAdded(e.target.files)}
              />
            </Flex>
          </CardHeader>
          <Divider borderColor="#fff" mb={4} />
          <CardBody h="100%" display="flex" flexDirection="column" gap={4}>
            <Box flex="2" overflowY="auto" w="100%">
              <Grid templateColumns="1fr 1fr" gap={4}>
                {projectDatasets.map((dataset) => (
                  <ProjectFileRow
                    key={dataset.csvId}
                    fileName={dataset.csv}
                    fileType="csv"
                    fileSize={`${dataset.size} MB`}
                    isSelected={selectedDatasets.includes(dataset.csvId)}
                    onSelect={() =>
                      selectedDatasets.includes(dataset.csvId)
                        ? handleDatasetDeselect(dataset.csvId)
                        : handleDatasetSelect(dataset.csvId)
                    }
                    onDelete={() => handleFileDelete(dataset.csvId)}
                  />
                ))}
              </Grid>
            </Box>
            <Box flex="1" h="200px" mt={4}>
              <DragAndDropArea onFilesAdded={handleFilesAdded} />
            </Box>
          </CardBody>
        </Card>
        {/* Flow Data Columns */}
        <Grid templateRows="1.5fr 1fr" gap={4}>
          <Card>
            <CardHeader mb="16px">
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Data Properties
              </Text>
            </CardHeader>
            <Divider borderColor="#fff" mb={1} />
            <CardBody
              maxH="250px"
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar": {
                  width: "0px",
                },
              }}
            >
              <Grid templateColumns="1fr 1fr 1fr" gap={3} mt={2}>
                {/* Numerical Properties */}
                <Box textAlign={"center"}>
                  <Text color="cyan.400" fontSize="md" fontWeight="bold" mb={2}>
                    Numerical
                  </Text>
                  {properties.numerical?.length > 0 ? (
                    properties.numerical.map((prop, index) => (
                      <Tooltip
                        key={index}
                        label={prop}
                        aria-label="Property Tooltip"
                      >
                        <Text
                          key={index}
                          color="gray.300"
                          maxWidth="180px" // ✅ 최대 너비 설정
                          isTruncated // ✅ 넘치면 ... 처리
                          noOfLines={1} // ✅ 한 줄로 제한
                          mb={1}
                        >
                          • {prop}
                        </Text>
                      </Tooltip>
                    ))
                  ) : (
                    <Text color="gray.500">No numerical properties</Text>
                  )}
                </Box>

                {/* Categorical Properties */}
                <Box textAlign={"center"}>
                  <Text
                    color="orange.400"
                    fontSize="md"
                    fontWeight="bold"
                    mb={2}
                  >
                    Categorical
                  </Text>
                  {properties.categorical?.length > 0 ? (
                    properties.categorical.map((prop, index) => (
                      <Tooltip
                        key={index}
                        label={prop}
                        aria-label="Property Tooltip"
                      >
                        <Text
                          key={index}
                          color="gray.300"
                          maxWidth="180px" // ✅ 최대 너비 설정
                          isTruncated // ✅ 넘치면 ... 처리
                          noOfLines={1} // ✅ 한 줄로 제한
                          mb={1}
                        >
                          • {prop}
                        </Text>
                      </Tooltip>
                    ))
                  ) : (
                    <Text color="gray.500">No categorical properties</Text>
                  )}
                </Box>

                {/* Unavailable Properties */}
                <Box textAlign={"center"}>
                  <Text color="red.400" fontSize="md" fontWeight="bold" mb={2}>
                    Unavailable
                  </Text>
                  {properties.unavailable?.length > 0 ? (
                    properties.unavailable.map((prop, index) => (
                      <Tooltip
                        key={index}
                        label={prop}
                        aria-label="Property Tooltip"
                      >
                        <Text
                          key={index}
                          color="gray.300"
                          maxWidth="180px" // ✅ 최대 너비 설정
                          isTruncated // ✅ 넘치면 ... 처리
                          noOfLines={1} // ✅ 한 줄로 제한
                          mb={1}
                        >
                          • {prop}
                        </Text>
                      </Tooltip>
                    ))
                  ) : (
                    <Text color="gray.500">No unavailable properties</Text>
                  )}
                </Box>
              </Grid>
            </CardBody>
          </Card>
          {/* 선택된 데이터셋 카드 */}
          <Card>
            <CardHeader mb="16px" justifyContent="space-between">
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Selected Data
              </Text>
              <IconButton
                size="sm"
                bg="green.500"
                icon={<CheckIcon h="20px" w="20px" color="#fff" />}
                colorScheme="green"
                aria-label="Apply Selection"
                onClick={handleApplySelection}
              />
            </CardHeader>
            <Divider borderColor="#fff" mb={4} />
            <CardBody>
              <SelectedDataArea
                selectedFiles={selectedDatasets} // ✅ 이제 csvId 배열만 전달
                allDatasets={projectDatasets} // ✅ 전체 프로젝트 데이터셋 전달
                onDeselect={(csvId) => handleDatasetDeselect(csvId)}
              />
            </CardBody>
          </Card>
        </Grid>
      </Grid>
    </Flex>
  );
};

export default SelectDatasetsPage;
