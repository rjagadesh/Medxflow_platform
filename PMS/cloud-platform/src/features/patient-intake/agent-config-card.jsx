import { Box, HStack, Text } from "@chakra-ui/react";
import { MoreHorizontal, MoreHorizontalIcon } from "lucide-react";

const AgentConfigCard = ({ name, handleClick }) => {
  return (
    <Box
      asChild
      className={
        "relative transition-all px-[2px] pt-[2px] duration-500 ease-in-out rounded-md 2xl:rounded-[16px]"
      }
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "inherit",
        padding: "1.5px",
        background: "linear-gradient(90deg, transparent, transparent)",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "xor",
        transition: "background 0.3s ease",
      }}
    >
      <>
        <Box
          height={{
            base: "140px",
            "2xl": "160px",
            "3xl": "180px",
          }}
          role="button"
          onClick={() => {
            handleClick();
          }}
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "inherit",
            padding: "1.5px",
            background: "linear-gradient(90deg, transparent, transparent)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            transition: "background 0.3s ease",
          }}
          _hover={{
            _before: {
              background: "linear-gradient(180deg, #5A9310, #94F219)",
            },
          }}
          className="bg-[#292929] rounded-2xl p-4 py-4 2xl:py-6 shadow-sm hover:shadow-md cursor-pointer group relative overflow-hidden transition-all duration-500 ease-in-out"
        >
          <HStack justifyContent={"space-between"} align={"center"}>
            <Text
              as={"h3"}
              fontSize={{
                base: "sm",
                "2xl": "17px",
                "3xl": "20px",
              }}
              letterSpacing={"widest"}
              className={"font-semibold text-[#575757] mb-2"}
            >
              {name}
            </Text>
            {/* <MoreHorizontalIcon size={24} className="ml-auto text-[#575757] " /> */}
          </HStack>
          <Text
            position={"absolute"}
            color={"#575757"}
            bottom={4}
            left={4}
            fontSize={"md"}
          >
            Created At :{" "}
            <span className="font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </Text>
        </Box>
      </>
    </Box>
  );
};

export default AgentConfigCard;
