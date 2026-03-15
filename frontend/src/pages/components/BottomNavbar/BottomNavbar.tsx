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
          label="Scenarios"
        />
        <BottomNavigationAction
          component={Link}
          to="/editor"
          value="/editor"
          label="Editor-map"
        />
        <BottomNavigationAction
          component={Link}
          to="/params"
          value="/params"
          label="Parameters"
        />
      </BottomNavigation>
    );
  };
