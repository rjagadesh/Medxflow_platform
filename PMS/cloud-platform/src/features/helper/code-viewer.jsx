import CustomButton from "@/components/button/button";
import { Dialog, Portal } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export function CodeViewer({ isOpen, onClose, title, content, language }) {
  const [fetchedContent, setFetchedContent] = useState(content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if content is a URL and fetch the content if necessary
  useEffect(() => {
    if (isOpen && content && content.startsWith("http")) {
      const fetchContent = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(content?.replace("http://", "https://"));
          if (response.ok) {
            const text = await response.text();
            try {
              const jsonData = JSON.parse(text);
              setFetchedContent(JSON.stringify(jsonData, null, 2));
            } catch (err) {
              setFetchedContent(text); // If not JSON, use raw text
            }
          } else {
            throw new Error("Failed to fetch content");
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchContent();
    }
  }, [isOpen, content]);
  return (
    <Dialog.Root scrollBehavior={"inside"} open={isOpen} onOpenChange={onClose}>
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
              {loading && <p>Loading...</p>}
              {error && <p className="text-red-500">Error: {error}</p>}
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code className={`language-${language} text-sm`}>
                  {fetchedContent}
                </code>
              </pre>
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
