"use client";

import CustomButton from "@/components/button/button";
import { CodeViewer } from "@/features/helper/code-viewer";
import PdfViewer from "@/features/helper/pdfViewer";
import { ResourceCard } from "@/features/helper/resource-card";
import { VideoPlayer } from "@/features/helper/video-player";
import { useGetFaqs } from "@/hooks/query/help/useGetFaqs";
import {
  Badge,
  Box,
  ButtonGroup,
  Center,
  Heading,
  IconButton,
  Input,
  InputGroup,
  Pagination,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Loader2 } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useDeferredValue, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";

const HelpPage = () => {
  const [modal, setModal] = useState({ type: null, title: "", content: "" });
  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(""),
  });

  const deferSearch = useDeferredValue(query.q);

  const {
    data: faqList,
    isLoading,
    isPlaceholderData,
  } = useGetFaqs({
    page: query.page,
    q: deferSearch,
  });
  console.log("faqList", faqList);

  const openModal = (type, title, content, language) => {
    setModal({ type, title, content, language });
  };

  const onPageChange = (v) => {
    setQuery((prev) => {
      return {
        ...prev,
        page: v,
      };
    });
  };

  const closeModal = () => {
    setModal({ type: null, title: "", content: "" });
  };

  const handleSearchChange = (v) => {
    setQuery((prev) => {
      return {
        ...prev,
        q: v,
      };
    });
  };

  console.log("modal1212", modal);

  return (
    <Box py="24px">
      <Box
        height={"200px"}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"start"}
        justifyContent={"center"}
        gap={{
          base: "0.5rem",
          "2xl": "1rem",
          "3xl": "1.5rem",
        }}
      >
        <Badge
          size={"lg"}
          borderColor={"#fff"}
          border="1px solid"
          bgColor={"transparent"}
          color="#fff"
          borderRadius={"2rem"}
          _hover={{
            bgColor: "droidalBlack.100",
          }}
        >
          FAQ
        </Badge>
        <Heading
          fontWeight={"semibold"}
          className="text-transparent bg-clip-text transition-colors"
          bgImage="var(--bg-blue-gradient)"
          fontSize={{ base: "2xl", "2xl": "3xl", "3xl": "4xl" }}
        >
          What can we help you find?
        </Heading>
        <InputGroup flex="1" startElement={<LuSearch size={20} />}>
          <Input
            size={"xl"}
            placeholder="Search..."
            color="white"
            pl={2}
            _placeholder={{ letterSpacing: "widest" }}
            letterSpacing="widest"
            borderColor={"#2f4d78"}
            borderRadius="full"
            transition={"all .2s ease-in-out"}
            _hover={{
              outlineColor: "transparent",
              border: "1px solid transparent",
              bgClip: "padding-box, border-box",
              backgroundOrigin: "padding-box, border-box",
              backgroundImage:
                "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
            }}
            w="300px"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </InputGroup>
      </Box>
      <Heading fontWeight={"semibold"} color="white" fontSize={"2xl"} mb={4}>
        Resources
      </Heading>
      {(isLoading || isPlaceholderData) && (
        <Center className="h-[250px]">
          <Loader2 color="white" className="animate-spin" />
        </Center>
      )}

      {faqList.results?.length === 0 && query.q && (
        <Center className="h-[250px]">
          <Text color={"white"} letterSpacing="widest" fontWeight={"300"}>
            No results found for <b>"{query.q}"</b>
          </Text>
        </Center>
      )}
      {faqList.results?.length === 0 && query.q?.length === 0 && (
        <Center className="h-[250px]">
          <Text color={"white"} letterSpacing="widest" fontWeight={"300"}>
            No results found
          </Text>
        </Center>
      )}

      <VStack gap="8" mb={8}>
        {faqList?.results?.map((resource) => (
          <ResourceCard
            title={resource.title}
            description={resource.description}
            hasVideo={!!resource.video_file_url}
            hasPython={!!resource.py_file_url}
            hasText={!!resource.txt_file_url}
            hasPdf={!!resource.py_file_url}
            hasJSON={!!resource.json_file_url}
            onPlayVideo={
              resource.video_file_url
                ? () =>
                    openModal("video", resource.title, resource.video_file_url)
                : undefined
            }
            onViewPython={
              resource.py_file_url
                ? () =>
                    openModal(
                      "code",
                      `${resource.title} - Python Code`,
                      resource.py_file_url,
                      "python"
                    )
                : undefined
            }
            onViewJSON={
              resource.json_file_url
                ? () =>
                    openModal(
                      "code",
                      `${resource.title} - JSON`,
                      resource.json_file_url,
                      "json"
                    )
                : undefined
            }
            onViewText={
              resource.txt_file_url
                ? () =>
                    openModal(
                      "code",
                      `${resource.title} - Documentation`,
                      resource.txt_file_url,
                      "text"
                    )
                : undefined
            }
            onViewPdf={
              resource.pdf_file_url
                ? () =>
                    openModal(
                      "pdf",
                      `${resource.title} - PDF`,
                      resource.pdf_file_url
                    )
                : undefined
            }
          />
        ))}
      </VStack>
      {faqList?.count > 0 && (
        <Pagination.Root
          color="white"
          count={faqList.count || 0}
          pageSize={10}
          defaultPage={1}
          onPageChange={(v) => onPageChange(v.page)}
        >
          <ButtonGroup variant="ghost" size="sm">
            <Pagination.PrevTrigger asChild>
              <IconButton>
                <LuChevronLeft color="#fff" />
              </IconButton>
            </Pagination.PrevTrigger>

            <Pagination.Items
              render={(page) => (
                <IconButton
                  _selected={{
                    color: "#fff",
                    backgroundImage: "var(--bg-blue-gradient)",
                    border: "none",
                  }}
                  color="#fff"
                  _hover={{ color: "#000" }}
                  variant={{ base: "ghost", _selected: "outline" }}
                  size={{
                    base: "xs",
                    "2xl": "sm",
                    "3xl": "md",
                  }}
                >
                  {page.value}
                </IconButton>
              )}
            />

            <Pagination.NextTrigger asChild>
              <IconButton>
                <LuChevronRight color="#fff" />
              </IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
      )}

      <VideoPlayer
        isOpen={modal.type === "video"}
        onClose={closeModal}
        title={modal.title}
        videoUrl={modal.content}
      />

      <CodeViewer
        isOpen={modal.type === "code"}
        onClose={closeModal}
        title={modal.title}
        content={modal.content}
        language={modal.language || "text"}
      />

      <PdfViewer
        isOpen={modal.type === "pdf"}
        onClose={closeModal}
        title={modal.title}
        pdfUrl={modal.content}
      />
    </Box>
  );
};

export default HelpPage;
