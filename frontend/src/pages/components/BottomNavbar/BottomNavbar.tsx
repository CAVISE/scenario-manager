import { useLocation, Link } from "react-router-dom";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";

import "./BottomNavbar.scss"

export const BottomNavbar = () => {
    return (
      <BottomNavigation showLabels value={useLocation().pathname} className="botnav_wrapper">
        <BottomNavigationAction
          component={Link}
          to="/"
          value="/"
          label="Сценарии"
        />
        <BottomNavigationAction
          component={Link}
          to="/editor"
          value="/editor"
          label="Карта"
        />
        <BottomNavigationAction
          component={Link}
          to="/params"
          value="/params"
          label="Параметры"
        />
      </BottomNavigation>
    );
  };