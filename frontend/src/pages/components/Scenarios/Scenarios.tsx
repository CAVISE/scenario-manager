import { Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";

import { Scenario, createNewScenario } from "../../../types/Scenario";

import "./Scenarios.scss"
import { useEditorStore } from "../../../store/useEditorStore";

const Scenarios = () => {
    const [scenarios] = useState<Scenario[]>([]);
    const [scenarioName, setScenarioName] = useState("");
    const kx = 0.086087664180445;
    const ky = 0.087651516713233;
    const updateScenario = useEditorStore(s => s.updateScenario);

    const handleEdit = (index: number) => {
        setScenarioName(scenarios[index].scenario_name);
        updateScenario({
            name:    scenarios[index].scenario_name,
            weather: scenarios[index].weather,
        });
        window.localStorage.setItem('scenario_id',   JSON.stringify(scenarios[index].scenario_id));
        window.localStorage.setItem('scenario_name', JSON.stringify(scenarios[index].scenario_name));
        window.localStorage.setItem('weather',       JSON.stringify(scenarios[index].weather));
        window.localStorage.setItem('scenario',      JSON.stringify(scenarios[index].scenario));
    };

    const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setScenarioName(event.target.value);
        updateScenario({ name: event.target.value });
        window.localStorage.setItem("scenario_name", JSON.stringify(event.target.value));
    };

    const handleCreateNewScenario = () => {
        setScenarioName("");
        createNewScenario();
    };

    useEffect(() => {
        if (window.localStorage.getItem('scenario_name') == null)
            createNewScenario();
        else
            setScenarioName(JSON.parse(window.localStorage.getItem('scenario_name')!));
    }, []);

    const handleSaveScenario = () => {
        const scen: Scenario = {
            scenario_id:   JSON.parse(window.localStorage.getItem('scenario_id')!),
            scenario_name: JSON.parse(window.localStorage.getItem('scenario_name')!),
            weather:       JSON.parse(window.localStorage.getItem('weather')!),
            scenario:      JSON.parse(window.localStorage.getItem('scenario')!),
        };

        scen.scenario = scen.scenario.map((item) => ({
            vehicle: item.vehicle,
            active:  item.active,
            color:   item.color,
            path:    item.path.map((point) => ({
                x: point.x * kx - 124.13208770751953,
                y: point.y * ky - 79.5,
                z: 0.6,
            })),
        }));

        window.localStorage.setItem('scenario', JSON.stringify(scen.scenario));
    };

    return (
        <div className="scenarios-wrapper">
            <div className="scenarios-list">
                {scenarios.map((scenario, index) => (
                    <div className="scenario-li" key={scenario.scenario_id ?? index}>
                        <h3 className="scenario-name">{scenario.scenario_name}</h3>
                        <div className="scenario-buttons">
                            <Button
                                className="scenario-button"
                                variant="contained"
                                onClick={() => handleEdit(index)}
                            >Refactor</Button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="scenarios-controls">
                <Button
                    className="scenario-button"
                    variant="contained"
                    onClick={handleCreateNewScenario}
                >New scenario</Button>
                <TextField
                    className="scenario-button"
                    variant="outlined"
                    label="scenario name"
                    onChange={handleChangeName}
                    value={scenarioName}
                />
                <Button
                    className="scenario-button"
                    variant="outlined"
                    onClick={handleSaveScenario}
                >Save scenario</Button>
            </div>
            <div/>
        </div>
    );
};

export default Scenarios;
