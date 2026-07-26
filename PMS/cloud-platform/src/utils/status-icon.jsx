import { Badge } from "@chakra-ui/react";

const getStatusIcon = (priority, options) => {
  console.log("priority", priority);
  switch (priority) {
    case "Active":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Active
        </Badge>
      );
    case "Paused":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-red-gradient)"
          py={"1.5"}
          {...options}
        >
          Paused
        </Badge>
      );
    case "completed":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-pending-gradient)"
          py={"1.5"}
          {...options}
        >
          Pending
        </Badge>
      );
    case "Draft":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-pending-gradient)"
          py={"1.5"}
          {...options}
        >
          Draft
        </Badge>
      );
    case "SUCCESS":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Success
        </Badge>
      );
    case "Priority":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-pending-gradient)"
          py={"1.5"}
          {...options}
        >
          Priority
        </Badge>
      );
    case "approved":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Approved
        </Badge>
      );
    case "Active Coverage":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Active Coverage
        </Badge>
      );
    case "checked_out":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Confirmed
        </Badge>
      );
    case "not_administered":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-red-gradient)"
          py={"1.5"}
          {...options}
        >
          Marked as Error
        </Badge>
      );
    case "active":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Active
        </Badge>
      );
    case "discontinued":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-red-gradient)"
          py={"1.5"}
          {...options}
        >
          Discontinued
        </Badge>
      );
    case "failed":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-red-gradient)"
          py={"1.5"}
          {...options}
        >
          Failed
        </Badge>
      );
    case "FAILED":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-red-gradient)"
          py={"1.5"}
          {...options}
        >
          Failed
        </Badge>
      );
    case "FAILURE":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-red-gradient)"
          py={"1.5"}
          {...options}
        >
          Failed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-blue-gradient)"
          py={"1.5"}
          {...options}
        >
          In Progress
        </Badge>
      );
    case "PENDING":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-pending-gradient)"
          py={"1.5"}
          {...options}
        >
          Pending
        </Badge>
      );
    case "Call In Progress":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bg="var(--bg-pending-gradient)"
          py={"1.5"}
          {...options}
        >
          Call In Progress
        </Badge>
      );
    case "NEW":
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          py={"1.5"}
          bg="var(--bg-blue-gradient)"
          {...options}
        >
          New
        </Badge>
      );
    case "Approved":
      return (
        <Badge
          color="#fff"
          size="lg"
          rounded={"full"}
          bg="var(--bg-green-gradient)"
          py={"1.5"}
          {...options}
        >
          Approved
        </Badge>
      );
    default:
      return (
        <Badge
          size="lg"
          color="#fff"
          rounded={"full"}
          bgColor={"transparent"}
          border={"1px solid"}
          py={"1.5"}
          borderColor={"#fff"}
          {...options}

          // bg="var(--bg-pending-gradient)"
        >
          {priority}
        </Badge>
      );
  }
};

export default getStatusIcon;
