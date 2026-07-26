import { Button } from "@chakra-ui/react/button";
import { Text } from "@chakra-ui/react/text";

const variantCss = {
  plain: {
    bgColor: "transparent",
    color: "white",
    "& :hover": {
      bgColor: "transparent !important",
      color: "transparent",
      bgClip: "text",
      bgImage:
        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
    },
  },
  solid: {
    bgImage:
      "linear-gradient(0deg, rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
    color: "white",
    border: "none",
    transition: "all 0.2s ease-in-out",

    "&:hover": {
      // Keep button background
      bgImage:
        "linear-gradient(0deg, rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",

      // Apply gradient text to INNER span
      "& span": {
        background:
          "linear-gradient(0deg, rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      },
    },
  },
  outline: {
    border: "1px solid white",
    color: "white",

    "&:hover": {
      bgColor: "black !important",
      color: "transparent !important",
      bgClip: "text !important",
      bgImage:
        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%) !important",
    },
  },
  danger: {
    bgImage: "linear-gradient(0deg, rgba(255,36,13,1) 0%, rgba(193,0,8,1) 72%)",
    border: "none",
    transition: "all 0.2s ease-in-out",
    color: "white",
    "& :hover": {
      color: "transparent",
      bgClip: "text",
      bgImage:
        "linear-gradient(0deg, rgba(255,36,13,1) 0%, rgba(193,0,8,1) 72%)",
    },
  },
};

const CustomButton = ({
  children,
  variant = "solid",
  leftIcon,
  size = "xs",
  rightIcon,
  ...props
}) => {
  return (
    <Button
      transition={"all 0.2s ease-in-out"}
      rounded="10px"
      size={size}
      {...props}
      css={variantCss[variant]}
    >
      {leftIcon && leftIcon}
      <Text
        fontSize={"md"}
        fontWeight={"semibold"}
        letterSpacing={"2px"}
        as={"span"}
      >
        {children}
      </Text>
      {rightIcon && rightIcon}
    </Button>
  );
};

export default CustomButton;
