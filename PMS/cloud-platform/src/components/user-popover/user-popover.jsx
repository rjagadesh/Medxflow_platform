import { Menu, Portal, Image } from "@chakra-ui/react";
import { CircleUser } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/store/providers/auth-provider";
import { useGETMe } from "@/hooks/query/useMe";

const UserMenu = () => {
  const { data, isLoading, isPlaceholderData } = useGETMe();
  const user = data || {};
  const { logout } = useAuth();
  const queryClient = new QueryClient();

  const navigate = useNavigate();
  return (
    <Menu.Root positioning={{ placement: "bottom-start" }}>
      <Menu.Trigger rounded="full" focusRing="outside">
        {user.logo ? (
          <Image
            src={`${user.logo?.replace("http:", "https:")}/`}
            boxSize="24px"
            borderRadius="full"
            objectFit="cover"
            border="1px solid"
            borderColor={"droidalGray.300"}
            onError={(e) => {
              e.currentTarget.src = "/PersonPlaceholder.png";
            }}
          />
        ) : (
          <CircleUser cursor={"pointer"} color="#fff" size={24} />
        )}
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              cursor={"pointer"}
              onClick={() => navigate("/settings/profile")}
              value="settings"
            >
              Profile
            </Menu.Item>
            <Menu.Item
              cursor={"pointer"}
              onClick={async () => {
                queryClient.clear(); // ✅ 1. clear cache first
                logout(); // ✅ 2. clear token/auth
                navigate("/login"); // ✅ 3. navigate last
                window.location.reload();
              }}
              value="droidal_community"
            >
              MedXFlow Community
            </Menu.Item>
            <Menu.Item
              cursor={"pointer"}
              onClick={() => {
                logout();
                navigate("/login");
                queryCache.clear();
              }}
              value="solution_center"
            >
              Solution Center
            </Menu.Item>
            <Menu.Item
              cursor={"pointer"}
              onClick={() => {
                logout();
                navigate("/login");
                queryCache.clear();
              }}
              value="customer_care"
            >
              Customer Care
            </Menu.Item>
            <Menu.Item
              cursor={"pointer"}
              onClick={() => {
                logout();
                navigate("/login");
                queryCache.clear();
              }}
              value="my_settings"
            >
              My Settings
            </Menu.Item>
            <Menu.Item
              cursor={"pointer"}
              onClick={() => {
                logout();
                navigate("/login");
                queryCache.clear();
              }}
              value="practice_settings"
            >
              Practice Settings
            </Menu.Item>
            <Menu.Item
              cursor={"pointer"}
              onClick={() => {
                logout();
                navigate("/login");
                queryCache.clear();
              }}
              value="privacy_policy"
            >
              Privacy Policy
            </Menu.Item>
            <Menu.Item
              cursor={"pointer"}
              onClick={() => {
                logout();
                navigate("/login");
                queryCache.clear();
              }}
              value="logout"
            >
              Logout
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default UserMenu;
