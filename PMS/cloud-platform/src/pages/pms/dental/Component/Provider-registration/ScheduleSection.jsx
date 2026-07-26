import { Box, Flex, HStack, Text, Grid, Button, Tag } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function WeeklyTimeRange({
  ranges,
  setRanges,
  selectedLocation,
  errors,
}) {
  const [activeEditor, setActiveEditor] = useState(null);
  const [draftRanges, setDraftRanges] = useState(null);
  // activeEditor = { location, day }

  /* ---------------------------------------------------
     1. RECONCILE STATE (IDENTICAL TO OLD CODE)
     --------------------------------------------------- */
  useEffect(() => {
    setRanges((prev) => {
      const next = {};

      selectedLocation?.forEach((location) => {
        next[location] = prev[location] || {};

        DAYS.forEach((day) => {
          next[location][day] = next[location][day] || {
            enabled: false,
            ranges: [],
          };
        });
      });

      return next;
    });
  }, [selectedLocation, setRanges]);

  /* ---------------------------------------------------
     2. SAFE RENDER MODEL (IDENTICAL STRUCTURE)
     --------------------------------------------------- */
  const safeRanges = useMemo(() => {
    const result = {};

    selectedLocation?.forEach((location) => {
      result[location] = ranges?.[location] || {};
      DAYS.forEach((day) => {
        result[location][day] = result[location][day] || {
          enabled: false,
          ranges: [],
        };
      });
    });

    return result;
  }, [ranges, selectedLocation]);

  /* ---------------------------------------------------
     3. TOGGLE DAY (UNCHANGED LOGIC)
     --------------------------------------------------- */
  const toggleDay = (location, day) => {
    setRanges((prev) => ({
      ...prev,
      [location]: {
        ...prev[location],
        [day]: {
          enabled: false,
          ranges: [],
        },
      },
    }));
  };

  /* ---------------------------------------------------
     4. OPEN EDITOR (CREATE DAY-SCOPED DRAFT)
     --------------------------------------------------- */
  // const openEditor = (location, day) => {
  //   const original = safeRanges[location][day].ranges || [];
  //   setDraftRanges(JSON.parse(JSON.stringify(original)));
  //   setActiveEditor({ location, day });
  // };
  const openEditor = (location, day) => {
    const current = safeRanges[location][day].ranges || [];

    const blocked = [];

    Object.entries(safeRanges).forEach(([loc, days]) => {
      if (loc === location) return;

      days?.[day]?.ranges?.forEach((r) => {
        blocked.push(r);
      });
    });

    setDraftRanges(JSON.parse(JSON.stringify(current)));
    setActiveEditor({ location, day, blocked });
  };

  /* ---------------------------------------------------
     5. SAVE DRAFT (WRITE BACK TO location → day)
     --------------------------------------------------- */
  const saveDraft = () => {
    if (!activeEditor) return;

    const { location, day } = activeEditor;

    setRanges((prev) => ({
      ...prev,
      [location]: {
        ...prev[location],
        [day]: {
          enabled: draftRanges.length > 0,
          ranges: draftRanges,
        },
      },
    }));

    setDraftRanges(null);
    setActiveEditor(null);
  };

  /* ---------------------------------------------------
     6. CLOSE / CANCEL (DISCARD DRAFT)
     --------------------------------------------------- */
  const closeEditor = () => {
    setDraftRanges(null);
    setActiveEditor(null);
  };

  /* ---------------------------------------------------
     7. RENDER
     --------------------------------------------------- */
  return (
    <Box w="100%" mt="25px">
      <Text fontWeight="300" color="white" mb={4}>
        Work Timings{" "}
        <Text as="span" color="red">
          *
        </Text>
      </Text>

      {!selectedLocation?.length && (
        <Text color="gray.400">
          Select a location to configure working hours
        </Text>
      )}

      {selectedLocation?.map((location) => (
        <Box key={location} mb={6}>
          <Text mb={2} fontWeight="600" color="cyan.300">
            {location}
          </Text>

          <Grid templateColumns="repeat(7, 1fr)" gap={3}>
            {DAYS.map((day) => {
              const cell = safeRanges[location][day];
              const isEnabled = cell.ranges?.length > 0;

              return (
                <Flex
                  key={day}
                  direction="column"
                  gap={1}
                  px={4}
                  py={2}
                  borderRadius="md"
                  cursor="pointer"
                  bg={isEnabled ? "var(--bg-blue-gradient2)" : "transparent"}
                  opacity={isEnabled ? 0.9 : 0.5}
                  _hover={{ bg: "var(--bg-blue-gradient)" }}
                  onClick={() => {
                    // toggleDay(location, day);
                    openEditor(location, day);
                  }}
                >
                  <HStack spacing={1}>
                    <input
                      type="checkbox"
                      checked={!!isEnabled}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleDay(location, day)}
                    />
                    <Text color="white" fontSize="sm">
                      {day}
                    </Text>
                  </HStack>

                  {cell.ranges.map((r, i) => (
                    <Text
                      key={i}
                      fontSize="xs"
                      color={isEnabled ? "black" : "white"}
                    >
                      {r.start} – {r.end}
                    </Text>
                  ))}
                </Flex>
              );
            })}
          </Grid>
        </Box>
      ))}

      {errors?.week && (
        <Text fontSize="12px" color="#ef4444" mt="4px">
          {errors.week}
        </Text>
      )}

      {/* ------------------ TIMELINE MODAL ------------------ */}
      {activeEditor && (
        <TimelineModal
          day={activeEditor.day}
          ranges={draftRanges}
          blockedRanges={activeEditor.blocked}
          onClose={closeEditor}
          onSave={saveDraft}
          onAdd={(range) => setDraftRanges((prev) => [...prev, range])}
          onRemove={(index) =>
            setDraftRanges((prev) => {
              const updated = prev.filter((_, i) => i !== index);
              return updated;
            })
          }
        />
      )}
    </Box>
  );
}

/* =======================================================
   TIMELINE MODAL
   ======================================================= */

function TimelineModal({
  day,
  ranges,
  blockedRanges,
  onClose,
  onSave,
  onAdd,
  onRemove,
}) {
  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.600"
      zIndex={999}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg="gray.800"
        p={4}
        w="70vw"
        maxW="50vw"
        maxH="100vh"
        overflow="hidden"
        borderRadius="md"
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text color="white" fontWeight="600">
            {day} – Working Hours
          </Text>
          <HStack spacing={2}>
            <Button size="xs" onClick={onClose} borderRadius={"lg"}>
              Close
            </Button>
            <Button
              size="xs"
              colorScheme="cyan"
              onClick={onSave}
              borderRadius={"lg"}
            >
              Save
            </Button>
          </HStack>
        </Flex>

        <Box mb={3}>
          <Text fontSize="sm" color="gray.300" mb={1}>
            Selected Time Slots:
          </Text>

          {!ranges?.length && (
            <Text fontSize="xs" color="gray.500">
              No time selected
            </Text>
          )}

          <HStack flexWrap="wrap" spacing={2}>
            {ranges?.map((r, i) => (
              <Box key={i} size="sm" borderRadius="full" colorScheme="cyan">
                {r.start} – {r.end}
              </Box>
            ))}
          </HStack>
        </Box>

        <DayTimeline
          ranges={ranges}
          blockedRanges={blockedRanges}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </Box>
    </Box>
  );
}

/* =======================================================
   DAY TIMELINE (DAY-ONLY PAYLOAD)
   ======================================================= */

function DayTimeline({ ranges, blockedRanges = [], onAdd, onRemove }) {
  const PX_PER_MIN = 1;
  const HEIGHT = 25 * 60 * PX_PER_MIN;
  const [dragStart, setDragStart] = useState(null);

  const minToTime = (m) => {
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${h}:${mm}`;
  };

  const timeToMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const overlaps = (start, end) => {
    const all = [...ranges, ...blockedRanges];

    return all.some((r) => {
      const s = timeToMin(r.start);
      const e = timeToMin(r.end);
      return start < e && end > s;
    });
  };

  return (
    <Box
      position="relative"
      h="100vh"
      overflowY="auto"
      bg="gray.900"
      borderRadius="md"
    >
      <Box position="relative" h={`${HEIGHT}px`}>
        {Array.from({ length: 24 }).map((_, h) => (
          <Box
            key={h}
            position="absolute"
            top={`${h * 60}px`}
            left={0}
            right={0}
            borderTop="1px solid #2a2a2a"
            fontSize="10px"
            color="gray.400"
            pl={2}
          >
            {String(h).padStart(2, "0")}:00
          </Box>
        ))}

        {ranges.map((r, i) => (
          <Box
            key={i}
            position="absolute"
            zIndex={2}
            top={`${timeToMin(r.start)}px`}
            h={`${timeToMin(r.end) - timeToMin(r.start)}px`}
            left={0}
            right={0}
            borderRadius="lg"
            letterSpacing="1px"
            backgroundImage="var(--bg-blue-gradient2)"
            // bg="rgba(52, 152, 219, 0.8)"
            color="white"
            _hover={{ bg: "var(--bg-blue-gradient)", opacity: "1" }}
            px={2}
            opacity={1}
          >
            <Flex h="100%" align="center" justify="space-between">
              <Text fontSize="xs" color="white">
                {r.start} – {r.end}
              </Text>
              <Button
                size="xs"
                bg="gray.900"
                borderRadius={"lg"}
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
              >
                Remove
              </Button>
            </Flex>
          </Box>
        ))}

        <Box
          position="absolute"
          inset={0}
          zIndex={1}
          cursor="crosshair"
          onMouseDown={(e) => setDragStart(e.nativeEvent.offsetY)}
          onMouseUp={(e) => {
            if (dragStart == null) return;

            const end = e.nativeEvent.offsetY;
            const from = Math.min(dragStart, end);
            const to = Math.max(dragStart, end);

            const startMin = Math.round(from / 15) * 15;
            const endMin = Math.round(to / 15) * 15;

            setDragStart(null);

            if (startMin === endMin) return;
            if (overlaps(startMin, endMin)) return;

            onAdd({
              start: minToTime(startMin),
              end: minToTime(endMin),
            });
          }}
        />
      </Box>
    </Box>
  );
}
