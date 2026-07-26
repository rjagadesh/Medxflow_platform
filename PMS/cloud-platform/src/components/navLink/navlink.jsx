import { Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

const CustomNavLink = ({ to, icon, children, ...props }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? "flex items-center gap-3 font-medium px-6 2xl:px-7 py-1.5 2xl:py-2  text-secondary-50 !bg-[#313131] hover:bg-secondary-600  hover:text-white transition-colors"
          : "flex items-center gap-3 font-medium px-6 2xl:px-7 py-1.5 2xl:py-2  text-secondary-50  hover:bg-[#0b2547]  hover:text-white transition-colors"
      }
      {...props}
    >
      {icon && <span className="nav-icon">{icon}</span>}
      <Text
        as={"span"}
        fontSize={{ base: "13px", "2xl": "15px", "3xl": "17px" }}
        className="nav-text"
      >
        {children}
      </Text>
    </NavLink>
  );
};

export default CustomNavLink;
