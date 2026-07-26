import { toaster } from "@/components/ui/toaster";
import { useSaveWorkSpace } from "@/hooks/mutation/workspace/useSaveWorkSpace";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const ABACodeBuilder = ({ taskName }) => {
  console.log("taskName", taskName);
  const { id: task_id, pod_id } = useParams();
  const { mutate, isPending } = useSaveWorkSpace(task_id);
  const [isIframeReady, setIsIframeReady] = useState(true);
  const iframeRef = useRef(null);

  const getJSONData = async (task_id) => {
    try {
      const response = await apiRequest(apiRoutes.task.workspaceLoad, {
        metadata: { id: task_id },
      });
      if (response.task_data) {
        sendMessageToIframe(response.task_data);
      }
    } catch (error) {
      return error;
    }
  };

  const sendMessageToIframe = (message) => {
    // Send message to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "PARENT_MESSAGE",
          content: JSON.stringify(message),
        },
        "*"
      ); // Use specific origin in production
    }
  };

  useEffect(() => {
    if (!isIframeReady) {
      getJSONData(task_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task_id, isIframeReady]);

  useEffect(() => {
    const handleMessage = (event) => {
      // Security: Check origin in production
      // if (event.origin !== 'https://your-trusted-domain.com') return;

      console.log("IFRAME_READY", event.data.type, event.data);

      if (event.data.type === "IFRAME_READY") {
        setIsIframeReady(false);
        addMessage("Iframe is ready for communication!", "iframe");
        return;
      }
      if (event.data.type === "SAVE_REQUEST") {
        const parseJson = JSON.parse(event.data.content);

        mutate(
          {
            task_data: parseJson,
            project: pod_id,
            task_name: taskName,
          },
          {
            onSuccess: (data) => {
              // getJSONData(task_id);
              toaster.success({
                title: "Success",
                description: "Workspace saved",
              });
            },
          }
        );
      }
      if (event.data.type === "RUN_REQUEST") {
        window.extensionId = "jdehhckfjldgkgmbeealligfdfoljkhk";
        window.postMessage(
          {
            action: "messageToExtension",
            data: {
              type: "runbetadev",
              taskid: task_id,
              token: localStorage.getItem("access"),
              domain: window.location.origin,
            },
          },
          "*"
        );
      }
      if (event.data.type === "PARENT_MESSAGE") {
        const eventType = JSON.parse(event.data.content).type;
        window.extensionId = "jdehhckfjldgkgmbeealligfdfoljkhk";
        window.postMessage(
          {
            action: "messageToExtension",
            data: {
              type: eventType,
              taskid: task_id,
              token: localStorage.getItem("access"),
              domain: window.location.origin,
            },
          },
          "*"
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskName]);

  const addMessage = (content, sender) => {
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      sender,
      timestamp: new Date(),
    };
  };

  return (
    <div className="w-full relative h-dvh">
      {isIframeReady && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loader color="#fff" className="animate-spin" size={35} />
        </div>
      )}

      <iframe
        ref={iframeRef}
        // src="http://192.168.10.28:8000/taskbuilder/"
        src={`https://dev-cloud.droidal.com/taskbuilder/?task-name=${taskName}&proid=${pod_id}`}
        width="100%"
        height="100%"
      />
    </div>
  );
};

export default ABACodeBuilder;
