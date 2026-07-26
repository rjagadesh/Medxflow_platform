"use client";
// import { ColorModeProvider } from "./color-mode";
import {
  createSystem,
  defaultConfig,
  defineConfig,
  ChakraProvider,
  defineSlotRecipe,
} from "@chakra-ui/react";
// import { CacheProvider } from "@emotion/react";
// import createCache from "@emotion/cache";
import { selectRecipe } from "@/styles/recipe/select.recipe";

const tableSlotRecipe = defineSlotRecipe({
  className: "chakra-table",
  slots: [
    "root",
    "header",
    "body",
    "row",
    "columnHeader",
    "cell",
    "footer",
    "caption",
  ],
  base: {
    root: {
      fontVariantNumeric: "lining-nums tabular-nums",
      borderCollapse: "collapse",
      width: "50% !important",
      textAlign: "start",
      verticalAlign: "top",
    },
    row: {
      _selected: {
        bg: "colorPalette.subtle",
      },
    },
    cell: {
      textAlign: "start",
      alignItems: "center",
    },
    columnHeader: {
      fontWeight: "medium",
      textAlign: "start",
      color: "fg",
    },
    caption: {
      fontWeight: "medium",
      textStyle: "xs",
    },
    footer: {
      fontWeight: "medium",
    },
  },

  variants: {
    interactive: {
      true: {
        body: {
          "& tr": {
            _hover: {
              bg: "colorPalette.subtle",
            },
          },
        },
      },
    },

    stickyHeader: {
      true: {
        header: {
          "& :where(tr)": {
            top: "var(--table-sticky-offset, 0)",
            position: "sticky",
            zIndex: 1,
          },
        },
      },
    },

    striped: {
      true: {
        row: {
          "&:nth-of-type(odd) td": {
            bg: "bg.muted",
          },
        },
      },
    },

    showColumnBorder: {
      true: {
        columnHeader: {
          "&:not(:last-of-type)": {
            borderInlineEndWidth: "1px",
          },
        },
        cell: {
          "&:not(:last-of-type)": {
            borderInlineEndWidth: "1px",
          },
        },
      },
    },

    variant: {
      line: {
        columnHeader: {
          borderBottomWidth: "1px",
        },
        cell: {
          borderBottomWidth: "1px",
        },
        row: {
          bg: "bg",
        },
      },

      outline: {
        root: {
          boxShadow: "0 0 0 1px {colors.border}",
          overflow: "hidden",
        },
        columnHeader: {
          borderBottomWidth: "1px",
        },
        header: {
          bg: "bg.muted",
        },
        row: {
          "&:not(:last-of-type)": {
            borderBottomWidth: "1px",
          },
        },
        footer: {
          borderTopWidth: "1px",
        },
      },
    },

    size: {
      sm: {
        root: {
          textStyle: "sm",
        },
        columnHeader: {
          px: "2",
          py: "2",
        },
        cell: {
          px: "2",
          py: "2",
        },
      },

      md: {
        root: {
          textStyle: "sm",
        },
        columnHeader: {
          px: "3",
          py: "3",
        },
        cell: {
          px: "3",
          py: "3",
        },
      },

      lg: {
        root: {
          textStyle: "md",
        },
        columnHeader: {
          px: "4",
          py: "3",
        },
        cell: {
          px: "4",
          py: "3",
        },
      },
    },
  },

  defaultVariants: {
    variant: "line",
    size: "md",
  },
});

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        secondary: {
          100: { value: "#6d7a8e" },
          200: { value: "#3c4e69" },
          300: { value: "#233856" },
          400: { value: "#0d2b52" },
        },
        primary: {
          50: { value: "#cef0fb" },
          100: { value: "#86daf6" },
          200: { value: "#55cbf2" },
          300: { value: "#24bcee" },
          400: { value: "#1a5dad" },
          500: { value: "#0ba2d4" },
          600: { value: "#0a90bd" },
          700: { value: "#0b7ba6" },
          800: { value: "#0b679f" },
          900: { value: "#0b5588" },
          950: { value: "#0b4471" },
        },
        // MedXFlow navy chrome (was near-black grays). 400 = brand ink #0d2b52.
        droidalBlack: {
          100: { value: "#2b5187" },
          200: { value: "#1e4270" },
          300: { value: "#16375e" },
          400: { value: "#0d2b52" },
          500: { value: "#0b2547" },
          600: { value: "#0a2040" },
          700: { value: "#081a35" },
          800: { value: "#07152b" },
          900: { value: "#051021" },
        },
        droidalGray: {
          300: { value: "#2f4d78" },
          400: { value: "#90a6c6" },
          500: { value: "#24406a" },
          600: { value: "#16375e" },
        },
      },
      fonts: {
        body: { value: "asen-pro, sans-serif" },
        heading: { value: "asen-pro, sans-serif" },
      },
      breakpoints: {
        sm: "30rem", // 480px
        md: "48rem", // 768px
        lg: "62rem", // 992px
        xl: "80rem", // 1280px
        "2xl": "90rem", // 1536px
        "3xl": "105rem", // 1680px
        "4xl": "120rem", // 1720px
      },

      semanticTokens: {
        colors: {
          primary: {
            solid: { value: "red" },
            contrast: { value: "{colors.primary.100}" },
            fg: { value: "{colors.primary.700}" },
            muted: { value: "{colors.primary.100}" },
            subtle: { value: "{colors.primary.200}" },
            emphasized: { value: "{colors.primary.300}" },
            focusRing: { value: "{colors.primary.500}" },
          },
        },
      },
      radii: {
        md: { value: "16px" },
        lg: { value: "12px" },
      },
    },
    breakpoints: {
      sm: "30rem", // 480px
      md: "48rem", // 768px
      lg: "62rem", // 992px
      xl: "80rem", // 1280px
      "2xl": "90rem", // 1536px
      "3xl": "105rem", // 1680px
      "4xl": "110rem", // 1720px
    },
    recipes: {
      select: selectRecipe,
      table: tableSlotRecipe,
    },

    keyframes: {
      pulse: {
        "0%": {
          transform: "scale(1)",
          boxSizing: "border-box",
          boxShadow: "0 0 0 0 rgba(0, 187, 242, 0.4)",
        },
        "70%": {
          transform: "scale(1.05)",
          boxSizing: "border-box",
          boxShadow: "0 0 0 15px rgba(0, 187, 242, 0)",
        },
        "100%": {
          transform: "scale(1)",
          boxSizing: "border-box",
          boxShadow: "0 0 0 0 rgba(0, 187, 242, 0)",
        },
      },
      wave: {
        "0%": { height: "8px" },
        "50%": { height: "24px" },
        "100%": { height: "8px" },
      },
    },
  },
  disableLayers: true,
});

// Make sure you're creating and exporting the system correctly

const { globalCss: _, ...restConfig } = config;
const system = createSystem(defaultConfig, config);

export function Provider(props) {
  return <ChakraProvider value={system} {...props} />;
  // return (
  //   <ChakraProvider value={system}>
  //     <ColorModeProvider {...props} />
  //   </ChakraProvider>
  // );
}
