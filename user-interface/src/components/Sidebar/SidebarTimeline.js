import React from "react";
import { Box, Text, Flex, Stack, Divider } from "@chakra-ui/react";
import { Link, useLocation, useParams } from "react-router-dom";
import { SimmmpleLogoWhite } from "components/Icons/Icons";

let sidebarMargins = "16px 0px 16px 16px";

const SidebarTimeline = () => {
  const { projectId, flowId } = useParams(); // 현재 URL에서 projectId와 flowId 가져오기
  const location = useLocation(); // 현재 URL 경로 가져오기

  const steps = [
    {
      title: "Datasets",
      subSteps: [
        {
          name: "Select Datasets",
          path: `/projects/${projectId}/flows/${flowId}/select-datasets`,
        },
      ],
    },
    {
      title: "Properties",
      subSteps: [
        {
          name: "Analyze Properties",
          path: `/projects/${projectId}/flows/${flowId}/analyze-properties`,
        },
        {
          name: "Configure Properties",
          path: `/projects/${projectId}/flows/${flowId}/configure-properties`,
        },
      ],
    },
    {
      title: "Models",
      subSteps: [
        {
          name: "Set Goals",
          path: `/projects/${projectId}/flows/${flowId}/set-goals`,
        },
        {
          name: "Set Priorities",
          path: `/projects/${projectId}/flows/${flowId}/set-priorities`,
        },
      ],
    },
    {
      title: "Results",
      subSteps: [
        {
          name: "Check Performance",
          path: `/projects/${projectId}/flows/${flowId}/check-performance`,
        },
        {
          name: "Optimization Results",
          path: `/projects/${projectId}/flows/${flowId}/optimization-results`,
        },
      ],
    },
  ];

  // 현재 URL에 기반하여 활성화된 Step 및 SubStep 계산
  const getCurrentStepAndSubStep = () => {
    let currentStep = -1;
    let currentSubStep = -1;

    steps.forEach((step, stepIndex) => {
      step.subSteps.forEach((subStep, subIndex) => {
        if (location.pathname === subStep.path) {
          currentStep = stepIndex;
          currentSubStep = subIndex;
        }
      });
    });

    return { currentStep, currentSubStep };
  };

  const { currentStep, currentSubStep } = getCurrentStepAndSubStep();

  return (
    <Box
      bg="linear-gradient(111.84deg, rgba(6, 11, 38, 0.94) 59.3%, rgba(26, 31, 55, 0) 100%)"
      display={{ sm: "none", xl: "block" }}
      position="fixed"
      h="calc(100vh - 32px)"
      w="260px"
      m={sidebarMargins}
      p={4}
      ps="20px"
      pt={"25px"}
      borderRadius="16px"
      boxShadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
    >
      {/* Header Section */}
      <Flex
        align="center"
        justify="center"
        direction="column"
        mb={6}
        position="relative"
      >
        {/* Logo and Text */}
        <Flex align="center" justify="center" mb="12px">
          <SimmmpleLogoWhite w="22px" h="22px" me="10px" mt="2px" />
          <Box
            bg="linear-gradient(97.89deg, #FFFFFF 70.67%, rgba(117, 122, 140, 0) 108.55%)"
            bgClip="text"
          >
            <Text
              fontSize="md"
              letterSpacing="3px"
              mt="3px"
              fontWeight="medium"
              color="transparent"
            >
              Steps
            </Text>
          </Box>
        </Flex>
        {/* Separator */}
        <Divider
          orientation="horizontal"
          borderColor="gray.600"
          w="80%"
          mx="auto"
        />
      </Flex>

      {/* Timeline Steps */}
      <Stack spacing={6}>
        {steps.map((step, stepIndex) => (
          <Box key={stepIndex}>
            {/* Major Step */}
            <Flex
              bg={currentStep === stepIndex ? "blue.600" : "gray.700"}
              p={3}
              borderRadius="lg"
              cursor="pointer"
              mb={2}
              transition="all 0.3s ease"
              _hover={{
                transform: "scale(1.02)",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Text
                fontWeight="bold"
                color={currentStep === stepIndex ? "white" : "gray.400"}
              >
                {step.title}
              </Text>
            </Flex>

            {/* Sub-Steps */}
            <Stack spacing={2} pl={4}>
              {step.subSteps.map((subStep, subIndex) => (
                <Link to={subStep.path} key={subIndex}>
                  <Flex
                    p={2}
                    borderRadius="md"
                    bg={
                      currentStep === stepIndex && currentSubStep === subIndex
                        ? "blue.500"
                        : "rgba(255, 255, 255, 0.1)"
                    }
                    cursor="pointer"
                    transition="all 0.2s ease"
                    _hover={{
                      bg: "blue.400",
                      color: "#fff",
                    }}
                  >
                    <Text
                      fontSize="sm"
                      color={
                        currentStep === stepIndex && currentSubStep === subIndex
                          ? "#fff"
                          : "gray.300"
                      }
                    >
                      {subStep.name}
                    </Text>
                  </Flex>
                </Link>
              ))}
            </Stack>

            {/* Connecting Line */}
            {stepIndex < steps.length - 1 && (
              <Box
                h="20px"
                borderLeft="4px dotted rgba(255, 255, 255, 0.1)"
                ml="16px"
                m="20px 0px"
                mb="8px"
              ></Box>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default SidebarTimeline;
