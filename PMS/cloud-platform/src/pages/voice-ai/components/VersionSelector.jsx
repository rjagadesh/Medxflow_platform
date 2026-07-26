import React, { useEffect, useMemo } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import CustomSelect from "@/components/ui/select";
import { useGetAgentVersions } from "@/hooks/query/useGetAgentVersions";
import { atobAgentId } from "@/utils/helper";
import { Box, Text } from "@chakra-ui/react";
import { Span } from "@chakra-ui/react";
import getStatusIcon from "@/utils/status-icon";

const VersionSelector = ({
  label = "Version",
  placeholder = "Select Version",
  ...props
}) => {
  const { agent_app } = useParams();
  const agentId = agent_app ? atobAgentId(agent_app) : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const versionParam = searchParams.get("version");

  const { data: versionsData, isLoading } = useGetAgentVersions(agentId);
  const versions = versionsData || [];

  // Sort versions by created_date descending if needed, or rely on API order.
  // Assuming API returns in order or we sort by ID/Date.
  // Here we'll try to find "Active" or latest created.
  const sortedVersions = useMemo(() => {
    if (!versions.length) return [];
    // If not sorted by API, we can sort here. For now, assuming API returns meaningful order or just using array order.
    // If we want "last created", we might need to check created_date or id.
    return [...versions].sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date),
    );
  }, [versions]);

  useEffect(() => {
    if (versions.length > 0 && !versionParam) {
      // Logic:
      // 1. Find "Active" status version
      // 2. Else find last created (first in sorted list)

      const activeVersion = versions.find((v) => v.status === "Active");

      if (activeVersion) {
        setSearchParams({ version: activeVersion.version_number });
      } else {
        // Last created based on our sort
        const lastCreated = sortedVersions[0];
        if (lastCreated) {
          setSearchParams({ version: lastCreated.version_number });
        }
      }
    }
  }, [versions, versionParam, setSearchParams, sortedVersions]);

  const options = useMemo(() => {
    return sortedVersions.map((v) => ({
      label: `v${v.version_number} ${v.status ? `(${v.status})` : ""}`,
      value: v.version_number,
      status: v.status,
    }));
  }, [sortedVersions]);

  const currentValue = versionParam;

  if (isLoading && !versions.length) {
    return (
      <Box
        w="150px"
        h="32px"
        bg="whiteAlpha.100"
        borderRadius="md"
        animate="pulse"
      />
    );
  }

  console.log("options121", options);

  if (!versions.length) return null;

  return (
    <Box w="200px" color={"#fff"} {...props}>
      {label && (
        <Text mb={1} fontSize="xs" color="gray.400">
          {label}
        </Text>
      )}
      <Box position={"relative"}>
        <CustomSelect
          value={currentValue ? [currentValue] : []}
          onValueChange={(val) => {
            if (val && val.length > 0) {
              setSearchParams({ version: val[0] });
            }
          }}
          css={{
            "& button": {
              borderRadius: "4px !important",
              borderColor: "#2f4d78",
            },
          }}
          options={options}
          placeholder={placeholder}
          size="sm"
        />
        <Span pos={"absolute"} right={2} top={"1.5"} zIndex={1}>
          {getStatusIcon(
            options.find((o) => o.value === currentValue)?.status,
            {
              size: "xs",
              px: 2,
              py: 1,
            },
          )}
        </Span>
      </Box>
    </Box>
  );
};

export default VersionSelector;
