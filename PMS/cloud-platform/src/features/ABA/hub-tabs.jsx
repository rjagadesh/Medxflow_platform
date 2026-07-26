import { Tabs } from "@chakra-ui/react";
import { LuFolder, LuSquareCheck, LuUser } from "react-icons/lu";
import ABAdashboard from "@/pages/ABA/dashboard";
import FileUpload from "./file-upload";
import Trigger from "./trigger";
import { QueueList } from "./queue-list";
import { ConfigList } from "./config-list";
import { AssetsList } from "../../pages/Utilities/assets-list";
import { TransactionList } from "./transaction-list";
import MachineList from "./machine-list";
import TriggerList from "./trigger";

const HubTabs = () => {
  return (
    <Tabs.Root
      size={"lg"}
      className="text-white"
      css={{
        "& button": {
          fontSize: "11px !important",
        },
        "& button[aria-selected=true]": {
          color: "#fff !important",
        },
        "& button[aria-selected=false]": {
          color: "gray !important",
        },
      }}
      defaultValue="DASHBOARD"
    >
      <Tabs.List>
        <Tabs.Trigger value="DASHBOARD">DASHBOARD</Tabs.Trigger>
        {/* <Tabs.Trigger value="fileupload">FILE UPLOAD</Tabs.Trigger> */}
        <Tabs.Trigger value="trigger">TRIGGER</Tabs.Trigger>
        <Tabs.Trigger value="queue">QUEUE</Tabs.Trigger>
        {/* <Tabs.Trigger value="config">CONFIG</Tabs.Trigger> */}
        <Tabs.Trigger value="asset">ASSET</Tabs.Trigger>
        {/* <Tabs.Trigger value="transactions">TRANSACTION</Tabs.Trigger> */}
        <Tabs.Trigger value="machine">MACHINE</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="DASHBOARD">
        <ABAdashboard />
      </Tabs.Content>
      <Tabs.Content value="fileupload" p={"0px !important"}>
        <FileUpload />
      </Tabs.Content>
      <Tabs.Content value="trigger" p={"0px !important"}>
        <TriggerList />
      </Tabs.Content>
      <Tabs.Content value="queue" p={"0px !important"}>
        <QueueList />
      </Tabs.Content>
      <Tabs.Content value="config" p={"0px !important"}>
        <ConfigList />
      </Tabs.Content>
      <Tabs.Content value="asset" p={"0px !important"}>
        <AssetsList />
      </Tabs.Content>
      <Tabs.Content value="transactions" p={"0px !important"}>
        <TransactionList />
      </Tabs.Content>
      <Tabs.Content value="machine" p={"0px !important"}>
        <MachineList />
      </Tabs.Content>
      <Tabs.Content value="projects">Manage your projects</Tabs.Content>
      <Tabs.Content value="tasks">
        Manage your tasks for freelancers
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default HubTabs;
