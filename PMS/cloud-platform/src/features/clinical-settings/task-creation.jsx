import React from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Stack,
  Input,
  NativeSelect,
} from '@chakra-ui/react';

const TaskCreation = () => {
  return (
    <Box
      maxW="full"
      mx="auto"
      p={8}
      bg="#0d2b52"
      borderRadius="lg"
      boxShadow="lg"
      minH="calc(100vh -80px)"
    >
      <Heading
        textAlign="start"
        color="white"
        mb={8}
        fontSize="20px"
        fontWeight="500"
        letterSpacing="1px"
      >
        Task Creation
      </Heading>
      <Box
        pb={4}
        bg="#2A2929"
        borderRadius="md"
        px={4}
      >
        <Stack spacing={4} mb={4}>
          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            {/* Assigned to */}
            <Box>
              <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
                Assigned to
              </Text>
              <NativeSelect.Root
                fontSize="14px"
                letterSpacing="1px"
                color="white"
                borderColor="#575B67"
              >
                <NativeSelect.Field>
                  <option value="">Search and select assignee</option>
                  <option value="user1">John Doe</option>
                  <option value="user2">Jane Smith</option>
                  <option value="user3">Bob Johnson</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
            {/* Subject */}
            <Box>
              <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
                Subject
              </Text>
              <Input
                placeholder="Enter subject"
                fontSize="14px"
                letterSpacing="1px"
                color="white"
                borderColor="#575B67"
                _placeholder={{ color: '#9ca3af' }}
              />
            </Box>
            {/* Due date */}
            <Box>
              <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
                Due date
              </Text>
              <NativeSelect.Root
                fontSize="14px"
                letterSpacing="1px"
                color="white"
                borderColor="#575B67"
              >
                <NativeSelect.Field>
                  <option value="">Select due date</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="nextweek">Next Week</option>
                  <option value="custom">Custom Date</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
            {/* Priority */}
            <Box>
              <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
                Priority
              </Text>
              <NativeSelect.Root
                fontSize="14px"
                letterSpacing="1px"
                color="white"
                borderColor="#575B67"
              >
                <NativeSelect.Field>
                  <option value="">Select priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          </Grid>
          {/* Comment - full width */}
          <Box>
            <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
              Comment
            </Text>
            <Input
              placeholder="Enter comment"
              fontSize="14px"
              letterSpacing="1px"
              color="white"
              borderColor="#575B67"
              _placeholder={{ color: '#9ca3af' }}
            />
          </Box>
        </Stack>

        {/* Second Grid */}
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          {/* Status */}
          <Box>
            <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
              Status
            </Text>
            <NativeSelect.Root
              fontSize="14px"
              letterSpacing="1px"
              color="white"
              borderColor="#575B67"
            >
              <NativeSelect.Field>
                <option value="">Select status</option>
                <option value="open">Open</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
          {/* Related */}
          <Box>
            <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
              Related
            </Text>
            <NativeSelect.Root
              fontSize="14px"
              letterSpacing="1px"
              color="white"
              borderColor="#575B67"
            >
              <NativeSelect.Field>
                <option value="">Select related</option>
                <option value="task">Task</option>
                <option value="project">Project</option>
                <option value="ticket">Ticket</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
          {/* Type */}
          <Box>
            <Text fontWeight="300" color="white" fontSize="14px" mb={1} letterSpacing="1px">
              Type
            </Text>
            <NativeSelect.Root
              fontSize="14px"
              letterSpacing="1px"
              color="white"
              borderColor="#575B67"
            >
              <NativeSelect.Field>
                <option value="">Select type</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="task">Task</option>
                <option value="improvement">Improvement</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
};

export default TaskCreation;