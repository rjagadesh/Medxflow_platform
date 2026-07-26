import CustomButton from "@/components/button/button";
import { Box, Center, Popover, Portal, Text, VStack } from "@chakra-ui/react";
import { BellIcon, Edit, MoreHorizontal, PlusIcon, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetMinutesOfMeetings } from "@/hooks/query/minutes-of-meetings/useGetMinutesOfMeetings";
import GenericTable from "@/components/table/table";
import UserMenu from "@/components/user-popover/user-popover";
import { useDeleteMinutesOfMeetings } from "@/hooks/mutation/minutes-of-meeting/useDeleteMinutesOfMeetings";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import PdfIcon from "@/assets/icons/pdf.svg?react";

// const MeetingCardSkeleton = () => {
//   return (
//     <Skeleton
//       color={"gray"}
//       className="dark"
//       rounded="2xl"
//       variant="shine"
//       height={{
//         base: "140px",
//         "2xl": "160px",
//         "3xl": "180px",
//       }}
//     />
//   );
// };

const Actions = ({ handleEdit, handleDelete, item, isDeleting }) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <CustomButton size="sm" variant="plain">
          <MoreHorizontal color="white" className="h-4 w-4" />
        </CustomButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className="!w-[180px]">
            <Popover.Arrow />
            <Popover.Body p={2}>
              <div className="py-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex items-center cursor-pointer w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </button>
                {/* <button
                  onClick={() => {
                    handleDelete(item);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button> */}

                <ConfirmationDialog
                  title="Confirmation"
                  description="Are you sure you want to delete the minutes of meeting?"
                  onConfirm={handleDelete}
                  buttonName="Delete"
                  customTriggerButton={true}
                  loading={isDeleting}
                />
              </div>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};
const MinutesOfMeeting = () => {
  const navigate = useNavigate();
  const { mutate: deleteMinutesOfMeeting, isPending: isDeleting } =
    useDeleteMinutesOfMeetings();

  const {
    data: meetings,
    isLoading,
    isPlaceholderData,
  } = useGetMinutesOfMeetings();

  const handleCreateMeeting = () => {
    // TODO: Update this route when you have a dedicated create MoM screen
    navigate("/smart-drive/minutes-of-meeting/create");
  };

  const hasMeetings = meetings && meetings.length > 0;

  if (!hasMeetings && !isLoading && !isPlaceholderData) {
    return (
      <Center height={"100%"}>
        <VStack align="center">
          <Text
            fontSize={{
              base: "md",
              "2xl": "lg",
              "3xl": "xl",
            }}
            margin={0}
            letterSpacing={"wider"}
            className="text-transparent bg-clip-text transition-colors"
            bgImage="var(--bg-blue-gradient)"
          >
            No Minutes of Meeting Found
          </Text>
          <Text color={"#90a6c6"}>
            Create a new minutes-of-meeting entry to get started.
          </Text>
          <CustomButton leftIcon={<PlusIcon />} onClick={handleCreateMeeting}>
            <Text
              fontSize={"md"}
              fontWeight={"semibold"}
              letterSpacing={"2px"}
              as={"span"}
            >
              Create Minutes of Meeting
            </Text>
          </CustomButton>
        </VStack>
      </Center>
    );
  }

  const columns = [
    {
      title: "Meeting Title",
      accessor_key: "name",
    },
    {
      title: "Meeting Date",
      accessor_key: "date",
    },

    {
      title: "Actions",
      accessor_key: "actions",
      render: (_, item) => (
        <Actions
          handleEdit={() =>
            navigate(`/smart-drive/minutes-of-meeting/view/${item.id}`)
          }
          isDeleting={isDeleting}
          handleDelete={() => {
            const promise = new Promise((resolve) => {
              deleteMinutesOfMeeting(
                { id: item.id },
                {
                  onSuccess: () => {
                    resolve(true);
                  },
                  onError: () => {
                    resolve(false);
                  },
                }
              );
            });
            return promise;
          }}
          item={item}
        />
      ),
    },
  ];
  return (
    <>
      <Box className="top-4 py-6 right-4 z-50 flex items-center justify-between w-full gap-4">
        <VStack justify={"space-between"} gap="2" align={"flex-start"}>
          <Text
            color="#fff"
            fontSize={{
              base: "lg",
              "2xl": "22px",
              "3xl": "2xl",
            }}
            letterSpacing={"widest"}
          >
            SmartDrive: Minutes of Meetings
          </Text>
        </VStack>

        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <UserMenu />
            <BellIcon color="#fff" size={24} />
          </div>
        </div>
      </Box>

      <GenericTable
        title="Minutes of Meetings"
        columns={columns}
        rightAction={
          <>
            <CustomButton leftIcon={<PlusIcon />} onClick={handleCreateMeeting}>
              <Text
                fontSize={"md"}
                fontWeight={"semibold"}
                letterSpacing={"2px"}
                as={"span"}
              >
                Create Minutes of Meeting
              </Text>
            </CustomButton>
          </>
        }
        data={meetings || []}
        loader={isLoading || isPlaceholderData}
        headerLoading={false}
        pagination={false}
        count={meetings.length}
        bodyHeight={{
          base: "calc(100vh - 380px)",
          "2xl": "calc(100vh - 430px)",
          "3xl": "calc(100vh - 440px)",
        }}
      />
    </>
  );
};

export default MinutesOfMeeting;
