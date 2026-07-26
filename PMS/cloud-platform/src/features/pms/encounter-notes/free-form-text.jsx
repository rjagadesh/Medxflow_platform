import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  Editable,
  Input,
  Portal,
  Text,
  CloseButton,
  Menu,
} from "@chakra-ui/react";
import { LuChevronRight } from "react-icons/lu";
import NoteSection from "./notes-section";
import { useOnOutsideClick } from "@/hooks/useOnOutsideClick";
import CustomInput from "@/components/input/input";
import { useEncounterNotes } from "@/pages/pms/encounter/encounter-notes/encounter-notes-context";

const MENU_DATA = {
  label: "Chief Complaint",
  submenu: [
    {
      label: "Pain-Related Complaints",
      submenu: [
        { label: "Headache" },
        { label: "Chest Pain" },
        { label: "Abdominal Pain" },
      ],
    },
  ],
};

const MenuItemRecursive = ({ item }) => {
  if (item.submenu) {
    return (
      <Menu.Root positioning={{ placement: "right-start", gutter: 2 }}>
        <Menu.TriggerItem
          justifyContent="space-between"
          _hover={{ bg: "droidalBlack.100", cursor: "pointer" }}
          bg="transparent"
          color="white"
          px={3}
          py={2}
          fontSize="sm"
          w="full"
        >
          {item.label} <LuChevronRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              bg="droidalBlack.300"
              border="1px solid #2f4d78"
              color="white"
              borderRadius="4px !important"
              py={1}
              minW="200px"
              zIndex={10001}
            >
              {item.submenu.map((subItem, index) => (
                <MenuItemRecursive key={index} item={subItem} />
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  }
  return (
    <Menu.Item
      value={item.label}
      _hover={{ bg: "droidalBlack.100", cursor: "pointer" }}
      bg="transparent"
      color="white"
      px={3}
      py={2}
      fontSize="sm"
    >
      {item.label}
    </Menu.Item>
  );
};

const TemplateMenu = ({ containerRef }) => {
  return (
    <Menu.Root
      size={"sm"}
      positioning={{
        placement: "left-start",
      }}
    >
      <Menu.Trigger asChild>
        <Button
          size="xs"
          variant="outline"
          color="white"
          borderColor="droidalGray.300"
          fontWeight="normal"
          _hover={{ bg: "whiteAlpha.100" }}
        >
          Template
        </Button>
      </Menu.Trigger>
      <Portal container={containerRef}>
        <Menu.Positioner>
          <Menu.Content
            bg="droidalBlack.300"
            border="1px solid #2f4d78"
            color="white"
            borderRadius="4px !important"
            py={1}
            minW="200px"
            zIndex={10000}
          >
            <MenuItemRecursive item={MENU_DATA} />
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

const getCaretCoordinates = (element, position) => {
  const div = document.createElement("div");
  const style = window.getComputedStyle(element);
  const properties = [
    "direction",
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "MozTabSize",
  ];

  properties.forEach((prop) => {
    div.style[prop] = style[prop];
  });

  div.textContent = element.value.substring(0, position);
  const span = document.createElement("span");
  span.textContent = ".";
  div.appendChild(span);

  div.style.position = "absolute";
  div.style.top = "0px";
  div.style.left = "0px";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";

  document.body.appendChild(div);
  const { offsetLeft: left, offsetTop: top } = span;
  document.body.removeChild(div);

  return { left, top };
};

const ShortcutList = ({
  isOpen,
  onClose,
  position,
  shortcuts,
  onSelect,
  containerRef,
}) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredShortcuts = shortcuts.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Portal container={containerRef}>
      <Box
        position="fixed"
        top={0}
        left={0}
        w="100vw"
        h="100vh"
        zIndex={9999}
        onClick={onClose}
      />
      <Box
        position="fixed"
        top={`${position.y}px`}
        left={`${position.x}px`}
        zIndex={10000}
        bg="droidalBlack.300"
        boxShadow="lg"
        borderRadius="md"
        width="200px"
        border="1px solid"
        borderColor="droidalGray.300"
      >
        <Box p={2} borderBottom="1px solid" borderColor="droidalGray.300">
          <CustomInput
            size="xs"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </Box>
        <Box maxH="150px" overflowY="auto">
          {filteredShortcuts.length > 0 ? (
            filteredShortcuts.map((s, i) => (
              <Box
                key={i}
                p={2}
                _hover={{
                  bg: "droidalBlack.200",
                  borderRadius: "0 0 14px 14px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  onSelect(s);
                  setSearch("");
                }}
              >
                <Text fontSize="sm" color="white" fontWeight="bold">
                  {s.name}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {s.text}
                </Text>
              </Box>
            ))
          ) : (
            <Box p={2}>
              <Text fontSize="xs" color="gray.500">
                No shortcuts found
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Portal>
  );
};

const CreateShortcutModal = ({ isOpen, onClose, selectedText, onSave }) => {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (name.trim()) {
      onSave(name);
      setName("");
      onClose();
    }
  };

  return (
    <Dialog.Root
      placement={"center"}
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="droidalBlack.300"
            color="white"
            border="1px solid #2f4d78"
          >
            <Dialog.Header>
              <Dialog.Title>Create Text Shortcut</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body pb={6}>
              <Box mb={4}>
                <Text mb={2} fontSize="sm">
                  Text Shortcut Name
                </Text>
                <Input
                  placeholder="Enter shortcut name"
                  borderColor="#2f4d78"
                  _hover={{ borderColor: "gray.500" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Box>
              {selectedText && (
                <Box mt={4} p={2} bg="droidalBlack.400" borderRadius="md">
                  <Text fontSize="sm" color="droidalGray.400" noOfLines={3}>
                    {selectedText}
                  </Text>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  color="white"
                  size="sm"
                >
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button colorScheme="blue" onClick={handleCreate} size="sm">
                Create Text Shortcut
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const FreeTextNote = ({
  initialValue,
  title,
  placeholder,
  extraActions,
  children,
}) => {
  const { getSectionState, updateNote, updateSectionData } =
    useEncounterNotes();
  const sectionState = getSectionState(title);
  const manualNote = sectionState.note || "";
  const generatedNote = sectionState.generated_note || "";

  const displayValue = generatedNote
    ? manualNote
      ? `${generatedNote}\n${manualNote}`
      : generatedNote
    : manualNote;

  const saveFullText = (newFullText) => {
    if (generatedNote) {
      if (newFullText.startsWith(generatedNote)) {
        let remainder = newFullText.slice(generatedNote.length);
        if (remainder.startsWith("\n")) {
          remainder = remainder.slice(1);
        }
        updateNote(title, remainder);
      } else {
        // Break link: convert everything to manual
        updateSectionData(title, { note: newFullText, generated_note: "" });
      }
    } else {
      updateNote(title, newFullText);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [showPopover, setShowPopover] = useState(false);
  const inputTypeRef = useRef(null);
  const containerRef = useRef(null);
  useOnOutsideClick(containerRef, () => {
    setShowPopover(false);
    setIsEditing(false);
  });

  // Shortcut state
  const [shortcuts, setShortcuts] = useState([]);
  const [isShortcutListOpen, setIsShortcutListOpen] = useState(false);
  const [shortcutListPos, setShortcutListPos] = useState({ x: 0, y: 0 });
  const [caretIndex, setCaretIndex] = useState(0);
  const textareaRef = useRef(null);

  const updateCaretInfo = (textarea) => {
    if (!textarea) return;
    textareaRef.current = textarea;
    const pos = textarea.selectionStart;
    setCaretIndex(pos);

    const caret = getCaretCoordinates(textarea, pos);
    const rect = textarea.getBoundingClientRect();
    const x = rect.left + caret.left - textarea.scrollLeft;
    const y = rect.top + caret.top - textarea.scrollTop + 20;
    setShortcutListPos({ x, y });
  };

  const handleSelection = (e) => {
    const textarea = e.target;
    updateCaretInfo(textarea);

    const text = textarea.value
      .substring(textarea.selectionStart, textarea.selectionEnd)
      .trim();

    if (text.length > 0) {
      let x, y;
      if (e.type === "mouseup") {
        x = e.clientX;
        y = e.clientY;
      } else if (inputTypeRef.current === "keyboard") {
        const rect = textarea.getBoundingClientRect();
        const pos =
          textarea.selectionDirection === "backward"
            ? textarea.selectionStart
            : textarea.selectionEnd;
        const caret = getCaretCoordinates(textarea, pos);
        x = rect.left + caret.left - textarea.scrollLeft;
        y = rect.top + caret.top - textarea.scrollTop + 20; // Approx line height offset
      } else {
        return;
      }
      setPopoverPos({ x, y });
      setSelectedText(text);
      setShowPopover(true);
    } else {
      setShowPopover(false);
    }
  };

  const onClose = () => setIsOpen(false);
  const onOpen = () => setIsOpen(true);

  const handleSaveShortcut = (name) => {
    setShortcuts((prev) => [...prev, { name, text: selectedText }]);
  };

  const handleShortcutSelect = (shortcut) => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Use state value if textarea value might be stale, but typically textarea.value is current in DOM
      // However, since we are controlled, we should rely on noteValue, but textarea ref gives cursor position context.
      // Wait, if controlled, textarea.value IS noteValue.
      const val = displayValue || "";
      const pre = val.substring(0, caretIndex);
      const post = val.substring(caretIndex);
      const newVal = pre + shortcut.text + post;
      saveFullText(newVal);
    }
    setIsShortcutListOpen(false);
  };

  return (
    <Box ref={containerRef}>
      <NoteSection
        title={title}
        isActive={isEditing}
        onTitleClick={() => setIsEditing(true)}
        onShortcutClick={() => setIsShortcutListOpen(true)}
        options={{ textShortcut: true, template: true }}
        templateTrigger={<TemplateMenu containerRef={containerRef} />}
        extraActions={extraActions}
      >
        {typeof children === "function" ? children({ isEditing }) : children}
        <Editable.Root
          edit={isEditing}
          value={displayValue}
          onValueChange={(val) => saveFullText(val.value)}
          placeholder={placeholder}
          _placeholder={{
            color: "droidalGray.400",
          }}
          _placeholderShown={{
            color: "droidalGray.400",
          }}
          color={displayValue ? "white" : "droidalGray.400"}
          isPreviewFocusable={false}
          selectOnFocus={false}
          onEditChange={(v) => {
            if (v.edit) {
              setIsEditing(true);
            }
          }}
        >
          <Editable.Preview
            w="100%"
            p={2}
            fontSize="sm"
            fontWeight="light"
            letterSpacing="wider"
            _hover={{
              bg: "whiteAlpha.100",
              cursor: "text",
            }}
          />
          <Editable.Textarea
            minH="100px"
            p={2}
            fontSize="sm"
            fontWeight="light"
            letterSpacing="wider"
            onMouseDown={(e) => {
              inputTypeRef.current = "mouse";
              updateCaretInfo(e.target);
            }}
            onKeyDown={(e) => {
              inputTypeRef.current = "keyboard";
              updateCaretInfo(e.target);
            }}
            onMouseUp={handleSelection}
            onSelect={handleSelection}
            // onBlur={() => {
            //   setShowPopover(false);
            //   setIsEditing(false);
            // }}
            onFocus={(e) => {
              textareaRef.current = e.target;
            }}
            border="1px solid #2f4d78"
            _focus={{ boxShadow: "none", borderColor: "droidalGray.300" }}
          />
        </Editable.Root>

        {showPopover && (
          <Portal>
            <Box
              position="fixed"
              top={`${popoverPos.y + 10}px`}
              left={`${popoverPos.x}px`}
              zIndex={9999}
              bg="white"
              borderRadius="sm"
              boxShadow="md"
            >
              <Button
                size="xs"
                variant="subtle"
                colorScheme="white"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onOpen();
                  setShowPopover(false);
                }}
              >
                Make shortcut
              </Button>
              <Box
                position="absolute"
                top="-6px"
                left="10px"
                w="0"
                h="0"
                borderLeft="6px solid transparent"
                borderRight="6px solid transparent"
                borderBottom="6px solid"
                borderBottomColor={"white"}
              />
            </Box>
          </Portal>
        )}

        <CreateShortcutModal
          isOpen={isOpen}
          onClose={onClose}
          selectedText={selectedText}
          onSave={handleSaveShortcut}
        />

        <ShortcutList
          isOpen={isShortcutListOpen}
          onClose={() => setIsShortcutListOpen(false)}
          position={shortcutListPos}
          shortcuts={shortcuts}
          onSelect={handleShortcutSelect}
          containerRef={containerRef}
        />
      </NoteSection>
    </Box>
  );
};

export default FreeTextNote;
