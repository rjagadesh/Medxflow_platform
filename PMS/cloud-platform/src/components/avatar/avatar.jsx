function CustomAvatar({ initials, name }) {
  const colors = [
    "from-blue-400 to-blue-600",
    "from-green-400 to-green-600",
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
  ];

  const colorIndex = name.length % colors.length;

  return (
    <div
      className={`w-10 h-10 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center shadow-sm`}
    >
      <span className="text-white font-medium text-sm uppercase">
        {name.slice(0, 2)}
      </span>
    </div>
  );
}

export default CustomAvatar;
