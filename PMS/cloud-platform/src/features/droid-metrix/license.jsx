import { Button } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";

const License = () => {
  const licenseForm = useForm({
    defaultValues: {
      licenseNo: "",
    },
  });

  const onLicenseSubmit = (data) => {
    console.log(data);
  };
  return (
    <>
      <div className="flex flex-col gap-y-6">
        {/* License Number Input Section */}
        <div className="flex justify-end">
          <form
            onSubmit={licenseForm.handleSubmit(onLicenseSubmit)}
            className="flex items-center gap-3"
          >
            <label
              htmlFor="licenseNo"
              className="text-sm font-medium text-gray-700"
            >
              License No
            </label>
            <Controller
              name="licenseNo"
              control={licenseForm.control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Enter license number"
                />
              )}
            />
            <Button
              size={"sm"}
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Apply
            </Button>
          </form>
        </div>

        {/* License Information Display */}
        <div className="flex flex-col gap-y-4 max-w-2xl">
          <div className="grid grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              License No:
            </label>
            <div className="col-span-2 bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-800">
              LCNHEL202408100735
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Client:</label>
            <div className="col-span-2 bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-800">
              healthaxis
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Expiry Date:
            </label>
            <div className="col-span-2 bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-800">
              10-08-2025
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Edition:
            </label>
            <div className="col-span-2 bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-800">
              Standard
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              No. of Users:
            </label>
            <div className="col-span-2 bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-800">
              4
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default License;
