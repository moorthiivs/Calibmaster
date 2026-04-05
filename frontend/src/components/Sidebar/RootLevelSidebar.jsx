import React, { useContext } from "react";
import { Menu } from "antd";
import { BsHouseAddFill } from "react-icons/bs";
import { FcFactory } from "react-icons/fc";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faCertificate, faHdd, faDatabase, faServer } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/auth-context";
import { useNavigate, useLocation } from "react-router-dom";

const RootLevelSidebar = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarHandler = ({ key }) => {
    navigate(key);
  };

  return (
    <Menu mode="inline" theme="dark" selectedKeys={[location.pathname]} onClick={sidebarHandler}>
      {auth.department === "root" && (
        <>
          <Menu.Item key="/dashboard/labs" icon={<BsHouseAddFill />}>Add Lab</Menu.Item>
          <Menu.Item key="/dashboard/labs/list" icon={<FcFactory />}>List Lab</Menu.Item>
          <Menu.Item key="/dashboard/certificate-config/create" icon={<FontAwesomeIcon icon={faCertificate} />}>
            Create Config
          </Menu.Item>
          <Menu.Item key="/dashboard/certificate-config" icon={<FontAwesomeIcon icon={faList} />} >
            List Config
          </Menu.Item>
          <Menu.Item key="/dashboard/certificate-format" icon={<FontAwesomeIcon icon={faCertificate} />}>
            Certificate Format
          </Menu.Item>

          <Menu.Item key="/dashboard/data-storage" icon={<FontAwesomeIcon icon={faServer} />}>
            Data Storage
          </Menu.Item>
        </>
      )}
    </Menu>
  );
};

export default RootLevelSidebar;
