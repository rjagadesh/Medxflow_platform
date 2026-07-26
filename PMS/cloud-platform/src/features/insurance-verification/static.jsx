import {
  RiCheckDoubleLine,
  RiCloseCircleLine,
  RiFileList2Line,
  RiTimerLine,
} from "react-icons/ri";

export default function InsuranceStats() {
  const stats = [
    {
      title: "Requests",
      value: "201",
      icon: <RiFileList2Line className="text-lg text-blue-500" />,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    {
      title: "Completed",
      value: "140",
      icon: <RiCheckDoubleLine className="text-green-400 text-lg" />,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
    {
      title: "Pending",
      value: "135",
      icon: <RiTimerLine className="!text-yellow-500 text-lg" />,
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
    },
    {
      title: "Avg. Call Duration",
      value: "8",
      icon: <RiCloseCircleLine className="!text-red-500 text-lg" />,
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-droidal-black-300 text-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className=" text-sm font-medium mb-2">{stat.title}</p>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
            </div>
            <div
              className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
