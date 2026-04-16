import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useStatusesQuery } from './useStatusesQuery';

export const Statuses = () => {
    const { data: stats, isLoading, isError } = useStatusesQuery();

    if (isLoading) {
        return <List><ListItem><ListItemText primary="Loading statuses..." /></ListItem></List>;
    }

    if (isError || !stats) {
        return <List><ListItem><ListItemText primary="Failed to load statuses" /></ListItem></List>;
    }

    return(
        <List>
            {stats.map((stat) => (
                <ListItem
                    key={stat.scenario_id}
                >
                    <ListItemButton>
                        <ListItemText primary={stat.scenario_name} />
                        <ListItemText primary={stat.status == "true" ? "Ready" : "In progress"} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    )
}
