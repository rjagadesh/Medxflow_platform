import GenericTable from "@/components/table/table";
import { useGetQueuesRecord } from "@/hooks/query/queues/useGetQueueRecords";

const QueueRecords = () => {
  const { data: records = [] } = useGetQueuesRecord();

  const columns = [
    {
      title: "ID",
      accessor_key: "id",
    },
    {
      title: "Data",
      accessor_key: "data",
    },
    {
      title: "Status",
      accessor_key: "status",
    },
    {
      title: "Queue",
      accessor_key: "queue",
    },
  ];

  return (
    <>
      <GenericTable
        title="Records"
        columns={columns}
        // columnSettings={data?.[0]}
        data={records}
      />
    </>
  );
};

export default QueueRecords;
