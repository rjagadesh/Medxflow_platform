import { Spinner } from "@chakra-ui/react";
import { useEffect } from "react";

const DroidMetrix = () => {
  useEffect(() => {
    window.location.reload();
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <Spinner />
    </div>
  );
};

export default DroidMetrix;
