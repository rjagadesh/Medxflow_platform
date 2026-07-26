import { Link } from "react-router-dom";

const AppCard = ({ agent = {} }) => {
  const Icon = agent?.icon;
  const isImage = agent.image;

  console.log("agent1212", agent);

  return (
    <Link to={agent.url}>
      <div className="cursor-pointer group">
        {/* Glow Effect */}
        <div />

        {/* Card */}
        <div
          className={`relative transition-all duration-300 group-hover:scale-[1.20]`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {!isImage && (
              <div
                className={`p-5 3xl:p-8 rounded-3xl ${agent.color} shadow-lg`}
              >
                <Icon className="w-8 h-8 text-white md:w-14 md:h-14 3xl:w-16 3xl:h-16" />
              </div>
            )}
            {isImage && (
              <img
                src={agent.icon}
                className="w-24 h-24 rounded-3xl 3xl:w-28 3xl:h-28"
              />
            )}
          </div>
          {/* Text */}
          <h3 className="text-secondary-600 w-[120px] mx-auto !font-normal text-center text-[13px] 3xl:text-[16px] leading-tight">
            {agent.name}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default AppCard;
