import { defineRecipe } from "@chakra-ui/react";

export const selectRecipe = defineRecipe({
  base: {
    all: "unset !important",
  },
  variants: {
    size: {
      lg: { all: "unset !important" },
    },
  },
});
