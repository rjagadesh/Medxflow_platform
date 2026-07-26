import React from "react";
import {
  Box,
  IconButton,
  Input,
  VStack,
  Icon,
  Image as ChakraImage,
  Text,
  Button,
} from "@chakra-ui/react";
import Cropper from "react-easy-crop";
import { LuUpload, LuX } from "react-icons/lu";
import CustomButton from "@/components/button/button";

/* ---------- helpers ---------- */

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = url;
  });

const getCroppedImage = async (src, crop) => {
  const image = await createImage(src);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
    }, "image/jpeg");
  });
};

/* ---------- component ---------- */

const ProfileUploader = ({ value, onChange, upload, imageUrl }) => {
  const inputRef = React.useRef(null);

  // render-affecting state
  const [preview, setPreview] = React.useState(null);
  const [cropSrc, setCropSrc] = React.useState(null);

  // ✅ REQUIRED state (drag + zoom)
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);

  // save-only ref
  const cropPixelsRef = React.useRef(null);

  /* preview sync */
  React.useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    if (imageUrl) {
      setPreview(imageUrl);
      return;
    }

    setPreview(null);
  }, [value, imageUrl]);

  const clearImage = () => {
    upload?.(null); // ✅ kept exactly as requested
    onChange(null);
    setPreview(null);
    setCropSrc(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Upload box */}
      <Box
        border="1px dashed"
        borderColor="gray.600"
        borderRadius="12px"
        p={2}
        h="150px"
        w="150px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        _hover={{ borderColor: "blue.400" }}
        onClick={() => inputRef.current?.click()}
      >
        <Input
          ref={inputRef}
          type="file"
          display="none"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const url = URL.createObjectURL(file);
            setCropSrc(url);

            // reset crop state
            setCrop({ x: 0, y: 0 });
            setZoom(1);

            e.target.value = "";
          }}
        />

        {preview && !preview.includes("undefined/") ? (
          <Box position="relative" w="full" h="full">
            <ChakraImage
              src={preview}
              w="100%"
              h="100%"
              objectFit="cover"
              borderRadius="12px"
            />
            <IconButton
              size="xs"
              aria-label="Remove"
              position="absolute"
              top="-8px"
              right="-8px"
              bg="red.500"
              color="white"
              borderRadius="full"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
            >
              <Icon as={LuX} />
            </IconButton>
          </Box>
        ) : (
          <VStack spacing={1}>
            <Icon as={LuUpload} boxSize={5} color="gray.400" />
            <Text fontSize="xs" color="gray.400">
              Upload Profile Picture
            </Text>
          </VStack>
        )}
      </Box>

      {/* Crop overlay */}
      {cropSrc && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.700"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          border={"md"}
        >
          <Box bg="#292929fa" p={5} borderRadius="16px" w="90vw" maxW="560px">
            <Text color="white" mb={3}>
              Profile Picture
            </Text>

            <Box position="relative" h="360px">
              <Cropper
                image={cropSrc}
                aspect={1}
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => (cropPixelsRef.current = pixels)}
              />
            </Box>

            {/* Zoom slider */}
            <Box mt={4}>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </Box>

            <Box mt={6} display="flex" gap={3}>
              <CustomButton flex={1} onClick={() => setCropSrc(null)}>
                Cancel
              </CustomButton>
              {/* <Button
                color={"white"}
                _on
                flex={1}
                variant="outline"
                onClick={() => setCropSrc(null)}
              >
                Cancel
              </Button> */}

              <CustomButton
                flex={1}
                onClick={async () => {
                  if (!cropPixelsRef.current) return;

                  const cropped = await getCroppedImage(
                    cropSrc,
                    cropPixelsRef.current,
                  );

                  onChange(cropped);
                  upload?.(cropped);

                  setCropSrc(null);
                }}
              >
                Save
              </CustomButton>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default ProfileUploader;
