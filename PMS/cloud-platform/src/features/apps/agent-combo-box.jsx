import { useSearchAgent } from "@/hooks/query/useSearchAgent";
import { btoaAgentId, btoaDepartmentId } from "@/utils/helper";
import {
  Combobox,
  HStack,
  InputGroup,
  Portal,
  Span,
  Spinner,
  useListCollection,
  VStack,
  Button,
  Box,
} from "@chakra-ui/react";
import { SearchIcon } from "lucide-react";
import { memo, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";


const AgentComboBox = () => {
  const [selectedValue, setSelectedValue] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [recentHistory, setRecentHistory] = useState([]);
  const [usageCount, setUsageCount] = useState({});
  const navigate = useNavigate();

  // 🔹 Typing placeholder text list
  const typingTexts = [
    "Search by name or app...",
    1500
  ];

  const [shouldFetchAll, setShouldFetchAll] = useState(false);

  const { data: results = [], isError, isLoading, refetch } = useSearchAgent({
    enabled: shouldFetchAll || (!!inputValue && inputValue.length > 0),
    search: inputValue || "",
  });

// 👇 When user focuses, trigger fetching all apps once
useEffect(() => {
  if (isFocused && !inputValue) {
    setShouldFetchAll(true);
  }
}, [isFocused, inputValue]);


  useEffect(() => {
    const savedRecents = JSON.parse(localStorage.getItem("recentAgents") || "[]");
    const savedUsage = JSON.parse(localStorage.getItem("agentUsageCount") || "{}");
    setRecentHistory(savedRecents);
    setUsageCount(savedUsage);
  }, []);

  const { collection, set } = useListCollection({
    initialItems: results,
    itemToString: (item) => item.app_name || item.name || "Unknown",
    itemToValue: (item) => String(item.id || item._id || Math.random()),
  });

  const groupedResults = useMemo(() => {
    const groups = {};
    for (const item of collection.items) {
      const moduleName = item.module_name || "Uncategorized";
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(item);
    }

    // Optional: Sort groups alphabetically by module name
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});

    return sortedGroups;
  }, [collection.items]);


  const mostUsed = useMemo(() => {
    const flatList = Object.values(groupedResults).flat();
    return flatList
      .map((item) => {
        const usage = usageCount[item.id] || 0;
        const lastUsed = recentHistory.find((x) => x.id === item.id)?.last_used_at || 0;
        return {
          ...item,
          usage_count: usage,
          last_used_at: lastUsed,
        };
      })
      .filter((item) => item.usage_count > 0)
      .sort((a, b) => {
        if (b.usage_count === a.usage_count) {
          return new Date(b.last_used_at) - new Date(a.last_used_at);
        }
        return b.usage_count - a.usage_count;
      })
      .slice(0, 10);
  }, [groupedResults, usageCount, recentHistory]);

  const filteredGroups = useMemo(() => {
    if (activeFilter === "recent") return { "Recently Used": recentHistory };
    if (activeFilter === "most") return { "Most Used": mostUsed };
    return groupedResults;
  }, [groupedResults, activeFilter, recentHistory, mostUsed]);

  const handleValueChange = (details) => {
    const selected = details?.items[0];
    if (!selected) return;

    const agentId = selected.id;
    const moduleId = selected.module;
    const moduleName = selected.module_name;

    const encodeAgentId = btoaAgentId(agentId);
    const encodeModuleId = btoaDepartmentId(moduleId, moduleName);
    navigate(`/apps/${encodeModuleId}/${encodeAgentId}`);
    setSelectedValue(details.value);

    const now = new Date().toISOString();

    setRecentHistory((prev) => {
      const updated = [
        { ...selected, last_used_at: now },
        ...prev.filter((x) => x.id !== selected.id),
      ].slice(0, 10);
      localStorage.setItem("recentAgents", JSON.stringify(updated));
      return updated;
    });

    setUsageCount((prev) => {
      const updated = {
        ...prev,
        [selected.id]: (prev[selected.id] || 0) + 1,
      };
      localStorage.setItem("agentUsageCount", JSON.stringify(updated));
      return updated;
    });
  };

  const handleInputChange = (details) => {
    setInputValue(details.inputValue);
    setActiveFilter("all");
  };

  useEffect(() => {
    set((prev) => {
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(results);
      return prevStr !== nextStr ? results : prev;
    });
  }, [results, set]);

  const handleFocus = () => {
    setIsFocused(true);
    setActiveFilter("all");
  };
  const handleBlur = () => setIsFocused(false);

  return (
    <Combobox.Root
      width="300px"
      collection={collection}
      multiple={false}
      value={selectedValue}
      onValueChange={handleValueChange}
      onInputValueChange={handleInputChange}
      positioning={{ sameWidth: false, placement: "bottom-start" }}
    >
      <Combobox.Control>
        <Box position="relative" width="100%">
          <InputGroup
            endElement={
              isLoading && (inputValue || isFocused) ? <Spinner size="xs" /> : <SearchIcon />
            }
          >
            <Combobox.Input
              color="white"
              borderColor="#2f4d78"
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="" // Leave blank for typing overlay
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          {/* ✅ Typing effect overlay */}
          {!inputValue && !isFocused && (
            <Box
              position="absolute"
              top="50%"
              left="12px"
              transform="translateY(-50%)"
              color="gray.400"
              fontSize="sm"
              pointerEvents="none"
            >
          <TypeAnimation
            sequence={typingTexts}
            speed={15}
            repeat={Infinity}
            cursor={true}
          />
            </Box>
          )}
        </Box>
      </Combobox.Control>

      <Portal>
        <Combobox.Positioner>
          <Combobox.Content bgColor="droidalBlack.300" color="white" minW="sm">
            {isLoading ? (
              <HStack p="2">
                <Spinner size="xs" />
                <Span>Loading...</Span>
              </HStack>
            ) : isError ? (
              <Span p="2" color="fg.error">
                Error fetching agents
              </Span>
            ) : (
              <VStack align="stretch" spacing={2} p="2">
                {/* Tabs */}
                <HStack spacing={2} mb="2">
                  {["all", "recent", "most"].map((f) => (
                    <Button
                      key={f}
                      size="xs"
                      variant={activeFilter === f ? "solid" : "bold"}
                      onClick={() => setActiveFilter(f)}
                    >
                      {f === "all"
                        ? "All"
                        : f === "recent"
                        ? "Recently Used"
                        : "Most Used"}
                    </Button>
                  ))}
                </HStack>

                {/* Groups */}
                {(() => {
                  const allItems = Object.values(filteredGroups).flat();
                  if (!allItems.length) {
                    return (
                      <Span p="2" color="gray.500" fontSize="sm" textAlign="center">
                        {activeFilter === "recent"
                          ? "No recently used agents"
                          : activeFilter === "most"
                          ? "No most used agent yet"
                          : "No items available"}
                      </Span>
                    );
                  }

                  if (activeFilter === "most") {
                    const topUsed = mostUsed[0];
                    if (!topUsed)
                      return (
                        <Span p="2" color="gray.500" fontSize="sm" textAlign="center">
                          No most used agent yet
                        </Span>
                      );

                    return (
                      <div>
                        <Span fontWeight="bold" fontSize="sm" color="gray.400">
                          Most Used
                        </Span>
                        <Combobox.Item key={topUsed.id} item={topUsed}>
                          <HStack justify="space-between" textStyle="sm">
                            <Span>
                              {topUsed.app_name || topUsed.name || "Unknown Agent"}
                            </Span>
                          </HStack>
                          <Combobox.ItemIndicator />
                        </Combobox.Item>
                      </div>
                    );
                  }

                  return Object.entries(filteredGroups).map(([groupName, items]) =>
                    items && items.length > 0 ? (
                      <div key={groupName}>
                        <Span fontWeight="bold" fontSize="sm" color="gray.400">
                          {groupName}
                        </Span>
                        {items.map((agent, index) => (
                          <Combobox.Item
                            key={agent.id || `agent-${groupName}-${index}`}
                            item={agent}
                          >
                            <HStack justify="space-between" textStyle="sm">
                              <Span fontWeight="medium" truncate>
                                {agent.app_name || agent.name || "Unknown Agent"}
                              </Span>
                            </HStack>
                            <Combobox.ItemIndicator />
                          </Combobox.Item>
                        ))}
                      </div>
                    ) : null
                  );
                })()}
              </VStack>
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
};

export default memo(AgentComboBox);
