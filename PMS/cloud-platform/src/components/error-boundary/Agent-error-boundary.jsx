import { Text } from "@chakra-ui/react";
import { ErrorBoundary } from "react-error-boundary";
const AgentErrorBoundary = ({ children }) => {
  function Fallback({ error, resetErrorBoundary }) {
    return (
      <div role="alert">
        <Text letterSpacing={"widest"}>Something went wrong:</Text>
        <pre style={{ color: "red" }}>{error.message}</pre>
      </div>
    );
  }

  <ErrorBoundary FallbackComponent={Fallback} onReset={() => {}}>
    {children}
  </ErrorBoundary>;
};

export default AgentErrorBoundary;
