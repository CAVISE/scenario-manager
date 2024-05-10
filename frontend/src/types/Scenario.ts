export default interface World {
    day_time: "morning" | "day" | "evening" | "night";
    precipitation: "none" | "rain" | "snow";
    precipitation_intensity: number;
    glaze: boolean;
    fog: boolean;
}

export interface Color{
    r: number;
    g: number;
    b: number;
}

export interface VehicleWay {
    vehicle: string;
    path: {
        x: number;
        y: number;
        z: number;
    }[];
    active: boolean;
    color: Color;
}

export interface Scenario {
    scenario_id: string | null;
    scenario_name: string;
    // world: World;
    weather: "ClearNoon" | "CloudyNoon" | "WetNoon" | "WetCloudyNoon" | "SoftRainNoon" | "MidRainyNoon" | "HardRainNoon" | "ClearSunset" | "CloudySunset" | "WetSunset" | "WetCloudySunset" | "SoftRainSunset" | "MidRainSunset" | "HardRainSunset";
    scenario: VehicleWay[];
}

export const defWorld: World = {
    day_time: "morning",
    precipitation: "none",
    precipitation_intensity: 0,
    glaze: false,
    fog: false
}

export const createNewScenario = () => {
    const newScenario: Scenario = {
        scenario_id: null,
        scenario_name: "",
        // world: defWorld,
        weather: "ClearNoon",
        scenario: []
    };
    window.localStorage.setItem('scenario_id', JSON.stringify(newScenario.scenario_id));
    window.localStorage.setItem('scenario_name', JSON.stringify(newScenario.scenario_name));
    window.localStorage.setItem('weather', JSON.stringify(newScenario.weather));
    window.localStorage.setItem('scenario', JSON.stringify(newScenario.scenario));
}