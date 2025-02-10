import React from 'react';
import {
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Box,
  Avatar,
  Stack,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
} from '@chakra-ui/react';
import Card from 'components/Card/Card';
import CardHeader from 'components/Card/CardHeader';
import CardBody from 'components/Card/CardBody';
import TablesTableRow from 'components/Tables/TablesTableRow';

// 예시 팀원 데이터
const tablesTableData = [
  {
    //logo: avatar1,
    name: 'Esthera Jackson',
    email: 'alexa@simmmple.com',
    subdomain: 'Manager',
    domain: 'Organization',
    status: 'Online',
    date: '14/06/21',
  },
  {
    //logo: avatar2,
    name: 'Alexa Liras',
    email: 'laurent@simmmple.com',
    subdomain: 'Programmer',
    domain: 'Developer',
    status: 'Offline',
    date: '12/05/21',
  },
  {
    //logo: avatar3,
    name: 'Laurent Michael',
    email: 'laurent@simmmple.com',
    subdomain: 'Executive',
    domain: 'Projects',
    status: 'Online',
    date: '07/06/21',
  },
  {
    //logo: avatar4,
    name: 'Freduardo Hill',
    email: 'freduardo@simmmple.com',
    subdomain: 'Manager',
    domain: 'Organization',
    status: 'Online',
    date: '14/11/21',
  },
  {
    //logo: avatar5,
    name: 'Daniel Thomas',
    email: 'daniel@simmmple.com',
    subdomain: 'Programmer',
    domain: 'Developer',
    status: 'Offline',
    date: '21/01/21',
  },
  {
    //logo: avatar7,
    name: 'Mark Wilson',
    email: 'mark@simmmple.com',
    subdomain: 'Designer',
    domain: 'UI/UX Design',
    status: 'Offline',
    date: '04/09/20',
  },
];

const About = () => {
  return (
    <Container maxW="container.xl" py={8}>
      {/* 헤더 영역 */}
      <Flex direction="column" align="center" textAlign="center" mb={12}>
        <Heading as="h1" size="2xl" mb={4} color="#fff">
          SIXSENSE
        </Heading>
      </Flex>

      <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
        {/* Authors Table */}
        <Card overflowX={{ sm: 'scroll', xl: 'hidden' }} pb="0px">
          <CardHeader p="6px 0px 22px 0px">
            <Text fontSize="lg" color="#fff" fontWeight="bold">
              Authors Table
            </Text>
          </CardHeader>
          <CardBody>
            <Table variant="simple" color="#fff">
              <Thead>
                <Tr my=".8rem" ps="0px" color="gray.400">
                  <Th
                    ps="0px"
                    color="gray.400"
                    fontFamily="Plus Jakarta Display"
                    borderBottomColor="#56577A"
                  >
                    Author
                  </Th>
                  <Th
                    color="gray.400"
                    fontFamily="Plus Jakarta Display"
                    borderBottomColor="#56577A"
                  >
                    Function
                  </Th>
                  <Th
                    color="gray.400"
                    fontFamily="Plus Jakarta Display"
                    borderBottomColor="#56577A"
                  >
                    Status
                  </Th>
                  <Th
                    color="gray.400"
                    fontFamily="Plus Jakarta Display"
                    borderBottomColor="#56577A"
                  >
                    Employed
                  </Th>
                  <Th borderBottomColor="#56577A"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {tablesTableData.map((row, index, arr) => {
                  return (
                    <TablesTableRow
                      name={row.name}
                      logo={row.logo}
                      email={row.email}
                      subdomain={row.subdomain}
                      domain={row.domain}
                      status={row.status}
                      date={row.date}
                      lastItem={index === arr.length - 1 ? true : false}
                    />
                  );
                })}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </Flex>
    </Container>
  );
};

export default About;
