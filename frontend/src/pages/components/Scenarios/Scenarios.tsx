import { Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";

import { PORT } from "../../../VARS";

import { Scenario, createNewScenario } from "../../../types/Scenario";

import "./Scenarios.scss"

const Scenarios = () => {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [scenarioName, setScenarioName] = useState("");

    const fetchScenarios = () => {
        const host = "http://localhost:" + PORT + "/scenario/all";
        fetch(host)
            .then((response) => {
                console.log(response);
                return response.json();
            })
            .then((data) => {
                setScenarios(data);
            });
    }

    useEffect(() => {
        // setScenarios([
        //     {
        //         scenario_id: "123",
        //         scenario_name: "Сценарий 1",
        //         weather: "WetCloudyNoon",
        //         scenario: []
        //     },
        //     {
        //         scenario_id: "nvfjl",
        //         scenario_name: "Сценарий 2",
        //         weather: "MidRainyNoon",
        //         scenario: [
        //             {
        //                 vehicle: "audi.a2",
        //                 path: [
        //                     { x: 200, y: 200, z: 0.6 },
        //                     { x: 250, y: 250, z: 0.6 }
        //                 ],
        //                 active: true,
        //                 color: {
        //                     r: 100,
        //                     g: 255,
        //                     b: 255
        //                 }
        //             }
        //         ]
        //     },
        //     {
        //         scenario_id: "sffef",
        //         scenario_name: "Сценарий 3",
        //         weather: "CloudyNoon",
        //         scenario: [
        //             {
        //                 vehicle: "nissan.micra",
        //                 path: [
        //                     { x: 200, y: 200, z: 0.6 },
        //                     { x: 250, y: 250, z: 0.6 }
        //                 ],
        //                 active: true,
        //                 color: {
        //                     r: 100,
        //                     g: 255,
        //                     b: 255
        //                 }
        //             },
        //             {
        //                 vehicle: "audi.tt",
        //                 path: [
        //                     { x: 140, y: 200, z: 0.6 },
        //                     { x: 340, y: 100, z: 0.6 }
        //                 ],
        //                 active: true,
        //                 color: {
        //                     r: 100,
        //                     g: 100,
        //                     b: 100
        //                 }
        //             }
        //         ]
        //     }
        // ])
        fetchScenarios();

    }, [setScenarios]);

    const handleEdit = (index: number) => {
        setScenarioName(scenarios[index].scenario_name);

        window.localStorage.setItem('scenario_id', JSON.stringify(scenarios[index].scenario_id));
        window.localStorage.setItem('scenario_name', JSON.stringify(scenarios[index].scenario_name));
        window.localStorage.setItem('weather', JSON.stringify(scenarios[index].weather));
        window.localStorage.setItem('scenario', JSON.stringify(scenarios[index].scenario));
    }

    const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setScenarioName(event.target.value);
        window.localStorage.setItem("scenario_name", JSON.stringify(event.target.value));
    }

    const handleCreateNewScenario = () => {
        setScenarioName("");
        createNewScenario();
    }

    useEffect(() => {
        if (window.localStorage.getItem('scenario_name') == null)
            createNewScenario();
        else
            setScenarioName(JSON.parse(window.localStorage.getItem('scenario_name')!));
    }, [])

    const handleSaveScenario = async () => {
        const scen: Scenario = {
            scenario_id: JSON.parse(window.localStorage.getItem('scenario_id')!),
            scenario_name: JSON.parse(window.localStorage.getItem('scenario_name')!),
            weather: JSON.parse(window.localStorage.getItem('weather')!),
            scenario: JSON.parse(window.localStorage.getItem('scenario')!)
        };
        
        const kx = 0.058395855215065;
        const ky = 0.053634767293709;

        scen.scenario = scen.scenario.map((item) => (
            { vehicle: item.vehicle, path: item.path.map((point) => (
                {
                    x: point.x * kx - 124.13208770751953,
                    y: 151.98765563964844 - point.y * ky,
                    z: 0.6
                }
            )), active: item.active, color: item.color }
        ))

        let host = "localhost:" + PORT;
        if (scen.scenario_id == null)
            host += "/scenario/add";
        else
            host += "/scenario/edit/" + String(scen.scenario_id);
        const response = await fetch(host, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scen)
        });

        if (response.ok)
            fetchScenarios();
    }

    const handleRunScenario = (index: number) => {
        const host = "localhost:" + PORT + "/scenarios/run/" + scenarios[index].scenario_id;
        fetch(host)
            .then((response) => {
                console.log(response);
                return response.json();
            })
            .then((data) => {
                console.log(data);
            });
    }

    return (<div className="scenarios-wrapper">
        <div className="scenarios-list">
            {scenarios.map((scenario, index) => (<div className="scenario-li">
                <h3 className="scenario-name">{scenario.scenario_name}</h3>
                <div className="scenario-buttons">
                    <Button
                        className="scenario-button"
                        variant="contained"
                        onClick={() => (handleEdit(index))}
                    >Редактировать</Button>
                    <Button
                        className="scenario-button"
                        variant="contained"
                        onClick={() => (handleRunScenario(index))}
                    >Запустить</Button>
                </div>
            </div>))}
        </div>
        <div className="scenarios-controls">
            <Button
                className="scenario-button"
                variant="contained"
                onClick={handleCreateNewScenario}
            >Новый сценарий</Button>
            <TextField
                className="scenario-button"
                variant="outlined"
                label="Имя сценария"
                onChange={handleChangeName}
                value={scenarioName}
            ></TextField>
            <Button
                className="scenario-button"
                onClick={() => {
                    console.log(JSON.parse(window.localStorage.getItem('scenario_id')!));
                    console.log(JSON.parse(window.localStorage.getItem('scenario_name')!));
                    console.log(JSON.parse(window.localStorage.getItem('weather')!));
                    console.log(JSON.parse(window.localStorage.getItem('scenario')!));
                }}
            >Вывести в консоль хранилище</Button>
            <Button
                className="scenario-button"
                variant="outlined"
                onClick={handleSaveScenario}
            >Сохранить сценарий</Button>
        </div>
        <div></div>
    </div>)
}

export default Scenarios