import {
  RiAlertLine,
  RiAwardFill,
  RiCheckDoubleLine,
  RiTimerLine,
} from "react-icons/ri";

export default function PatientPerformanceMetrics() {
  const metrics = [
    {
      title: "Approval Rate",
      value: "65%",
      change: "+2.5%",
      changeColor: "text-green-600",
      icon: <RiCheckDoubleLine className="text-green-600 text-lg" />,
      color: "bg-green-100",
    },
    {
      title: "Avg. Approval Time",
      value: "1.5 days",
      change: "-0.3 days",
      changeColor: "text-green-600",
      icon: <RiTimerLine className="text-yellow-600 text-lg" />,
      color: "bg-yellow-100",
    },
    {
      title: "Appeals Success Rate",
      value: "80%",
      change: "+5.2%",
      changeColor: "text-green-600",
      icon: <RiAwardFill className="text-purple-600 text-lg" />,
      color: "bg-purple-100",
    },
    {
      title: "Flagged as Incomplete",
      value: "18",
      change: "-3",
      changeColor: "text-green-600",
      icon: <RiAlertLine className="text-red-600 text-lg" />,
      color: "bg-red-100",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">
          Performance Metrics
        </h3>
      </div>

      <div className="p-6 pt-0 space-y-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {metric.icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {metric.title}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xl font-bold text-slate-900">
                    {metric.value}
                  </span>
                  <span className={`text-xs font-medium ${metric.changeColor}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
