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
          to="/params"
          value="/params"
          label="Параметры"
        />
        <BottomNavigationAction
          component={Link}
          to="/paths"
          value="/paths"
          label="Выбор путей"
        />
        <BottomNavigationAction
          component={Link}
          to="/something"
          value="/something"
          label="Отчёты"
        />
      </BottomNavigation>
    );
  };