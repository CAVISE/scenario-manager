import { useEffect, useState } from "react"
import { PORT } from "../../../VARS";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

interface Status{
    scenario_id: string;
    scenario_name: string;
    ready: boolean;
}

export const Statuses = () => {
    const [stats, setStats] = useState<Status[]>([]);

    useEffect(() => {
        const host = "localhost:" + PORT + "/scenario/get/all";
        fetch(host)
            .then((response) => {
                console.log(response);
                return response.json();
            })
            .then((data) => {
                setStats(data);
            });

        // setStats([
        //     {
        //         scenario_id: "1241f",
        //         scenario_name: "scen1",
        //         ready: false
        //     },
        //     {
        //         scenario_id: "1241f23",
        //         scenario_name: "scen2",
        //         ready: true
        //     },
        //     {
        //         scenario_id: "1241f2fg",
        //         scenario_name: "scen3",
        //         ready: false
        //     }
        // ])
    }, []);

    return(
        <List>
            {stats.map((stat) => (
                <ListItem
                    key={stat.scenario_id}
                >
                    <ListItemButton>
                        <ListItemText primary={stat.scenario_name} />
                        <ListItemText primary={stat.ready ? "Готов" : "Выполняется"} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    )
}