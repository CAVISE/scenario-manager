import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { BottomNavbar } from "./components/BottomNavbar/BottomNavbar"
import { useEffect, useState } from "react"
import { useEditorStore } from "../store/useEditorStore";
// import { defWorld } from "../types/Scenario";
// import SelectVariants from "./components/Inputs/SelectVariants";
// import InputNumber from "./components/Inputs/InputNumber";
// import InputBoolean from "./components/Inputs/InputBoolean";

const ParamsPage = () => {
    // const [world, setWorld] = useState(defWorld);
    const [weather, setWeather] = useState("ClearNoon");
    const updateScenario = useEditorStore(state => state.updateScenario);
    useEffect(() => {
        const wthr = JSON.parse(window.localStorage.getItem('weather')!);
        setWeather(wthr);
    }, []);

    useEffect(() => {
        window.localStorage.setItem('weather', JSON.stringify(weather));
    }, [weather]);

    const handleWeatherChange = (event: SelectChangeEvent) => {
        setWeather(event.target.value);
        updateScenario({ weather: event.target.value });
    }

    return (<div>
        <BottomNavbar />
        <div>
            <h3>World parameters:</h3>
            <FormControl fullWidth margin="normal">
                <InputLabel id={"wthr-label"}>Weather</InputLabel>
                <Select
                    labelId={"wthr-label"}
                    id="wthr"
                    value={weather as string}
                    label="Weather"
                    onChange={handleWeatherChange}
                >
                    {["ClearNoon", "CloudyNoon", "WetNoon", "WetCloudyNoon", "SoftRainNoon", "MidRainyNoon", "HardRainNoon", "ClearSunset", "CloudySunset", "WetSunset", "WetCloudySunset", "SoftRainSunset", "MidRainSunset", "HardRainSunset"].map((val) => (
                        <MenuItem value={val} key={val}>{val}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            {/* <p>{world.day_time} {world.precipitation} {world.precipitation_intensity} {world.glaze} {world.fog}</p>
            <SelectVariants
                param="day_time"
                variants={["morning", "day", "evening", "night"]}
                state={world}
                setState={setWorld}
            />
            <SelectVariants
                param="precipitation"
                variants={["none", "rain", "snow"]}
                state={world}
                setState={setWorld}
            />
            <InputNumber
                param="precipitation_intensity"
                state={world}
                setState={setWorld}
            />
            <InputBoolean
                param="glaze"
                state={world}
                setState={setWorld}
            />
            <InputBoolean
                param="fog"
                state={world}
                setState={setWorld}
            /> */}
        </div>
    </div>)
}

export default ParamsPage
