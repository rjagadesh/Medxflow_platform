import CustomButton from "@/components/button/button";
import { Dialog, Portal } from "@chakra-ui/react";
import { useRef, useEffect } from "react";

export function VideoPlayer({ isOpen, onClose, title, videoUrl }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  return (
    <Dialog.Root size={"xl"} open={isOpen} onOpenChange={onClose}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor={"droidalBlack.300"}
            color={"white"}
            className="max-w-4xl"
          >
            <Dialog.Header>
              <Dialog.Title m={0}>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  className="w-full h-full"
                  preload="metadata"
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </Dialog.Body>
            <Dialog.Footer>
              <CustomButton onClick={onClose}>Close</CustomButton>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
