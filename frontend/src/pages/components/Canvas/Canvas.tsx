import { useEffect, useRef, useState } from "react"
import imgSrc from "../assets/map4k4k.png"
import './Canvas.scss'
import { Button, InputLabel, MenuItem, Select, SelectChangeEvent, IconButton, TextField } from "@mui/material"
import Draggable, { DraggableEvent, DraggableData } from "react-draggable"
import { Delete } from "@mui/icons-material"
import { NumberFormatValues, NumericFormat } from "react-number-format";
import { Color, VehicleWay } from "../../../types/Scenario"


const initColor: Color = {
    r: 127,
    g: 127,
    b: 127
} 

const Canvas = () => {
    const imageRef = useRef<HTMLImageElement>(null);
    // const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
    const [vehicles, setVehicles] = useState<VehicleWay[]>([]);
    const [vehicleModels, setVehicleModels] = useState<string[]>([]);
    const [activeVehicle, setActiveVehicle] = useState<number>(0);

    useEffect(() => {
        setVehicles(JSON.parse(window.localStorage.getItem('scenario')!));
    }, []);

    useEffect(() => {
        window.localStorage.setItem('scenario', JSON.stringify(vehicles))
    }, [vehicles]);

    useEffect(() => {
        const carsFromCarla = [
            [
                "vehicle",
                "audi",
                "a2"
            ],
            [
                "vehicle",
                "nissan",
                "micra"
            ],
            [
                "vehicle",
                "audi",
                "tt"
            ],
            [
                "vehicle",
                "mercedes",
                "coupe_2020"
            ],
            [
                "vehicle",
                "bmw",
                "grandtourer"
            ],
            [
                "vehicle",
                "harley-davidson",
                "low_rider"
            ],
            [
                "vehicle",
                "ford",
                "ambulance"
            ],
            [
                "vehicle",
                "micro",
                "microlino"
            ],
            [
                "vehicle",
                "carlamotors",
                "firetruck"
            ],
            [
                "vehicle",
                "carlamotors",
                "carlacola"
            ],
            [
                "vehicle",
                "carlamotors",
                "european_hgv"
            ],
            [
                "vehicle",
                "ford",
                "mustang"
            ],
            [
                "vehicle",
                "chevrolet",
                "impala"
            ],
            [
                "vehicle",
                "lincoln",
                "mkz_2020"
            ],
            [
                "vehicle",
                "citroen",
                "c3"
            ],
            [
                "vehicle",
                "dodge",
                "charger_police"
            ],
            [
                "vehicle",
                "nissan",
                "patrol"
            ],
            [
                "vehicle",
                "jeep",
                "wrangler_rubicon"
            ],
            [
                "vehicle",
                "mini",
                "cooper_s"
            ],
            [
                "vehicle",
                "mercedes",
                "coupe"
            ],
            [
                "vehicle",
                "dodge",
                "charger_2020"
            ],
            [
                "vehicle",
                "ford",
                "crown"
            ],
            [
                "vehicle",
                "seat",
                "leon"
            ],
            [
                "vehicle",
                "toyota",
                "prius"
            ],
            [
                "vehicle",
                "yamaha",
                "yzf"
            ],
            [
                "vehicle",
                "kawasaki",
                "ninja"
            ],
            [
                "vehicle",
                "bh",
                "crossbike"
            ],
            [
                "vehicle",
                "mitsubishi",
                "fusorosa"
            ],
            [
                "vehicle",
                "tesla",
                "model3"
            ],
            [
                "vehicle",
                "gazelle",
                "omafiets"
            ],
            [
                "vehicle",
                "tesla",
                "cybertruck"
            ],
            [
                "vehicle",
                "century",
                "diamondback"
            ],
            [
                "vehicle",
                "mercedes",
                "sprinter"
            ],
            [
                "vehicle",
                "audi",
                "etron"
            ],
            [
                "vehicle",
                "volkswagen",
                "t2"
            ],
            [
                "vehicle",
                "lincoln",
                "mkz_2017"
            ],
            [
                "vehicle",
                "dodge",
                "charger_police_2020"
            ],
            [
                "vehicle",
                "zx125",
                "vespa"
            ],
            [
                "vehicle",
                "mini",
                "cooper_s_2021"
            ],
            [
                "vehicle",
                "patrol_2021",
                "nissan"
            ],
            [
                "vehicle",
                "t2_2021",
                "volkswagen"
            ]
        ];
        setVehicleModels(carsFromCarla.map((item) => (
            item[1] + "." + item[2]
        )))
    }, [setVehicleModels])

    const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const image = imageRef.current;
        if (image) {
            const rect = image.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const z = 0.6;
            console.log(e.clientX, e.clientY, x, y);
            const newPoints = [...vehicles[activeVehicle].path, { x, y, z }];
            setVehicles(vehicles.map((item, it) => (
                it == activeVehicle ?
                    { vehicle: item.vehicle, path: newPoints, active: item.active, color: item.color } :
                    { vehicle: item.vehicle, path: item.path, active: item.active, color: item.color }
            )));
        }
    };

    const handleDeletePoints = () => {
        setVehicles(vehicles.map((item, it) => (
            it == activeVehicle ?
                { vehicle: item.vehicle, path: [], active: item.active, color: item.color } :
                { vehicle: item.vehicle, path: item.path, active: item.active, color: item.color }
        )));
    };

    const handleDeleteLast = () => {
        setVehicles(vehicles.map((item, it) => (
            it == activeVehicle ?
                { vehicle: item.vehicle, path: item.path.slice(0, -1), active: item.active, color: item.color } :
                { vehicle: item.vehicle, path: item.path, active: item.active, color: item.color }
        )));
    }

    const handleUsePoints = () => {
        console.log(vehicles);
    };

    const handleAddVehicle = () => {
        setVehicles([...vehicles, { vehicle: "", path: [], active: false, color: initColor } as VehicleWay])
    }

    const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
        const dx = data.x;
        const dy = data.y;
        const key = Number(data.node.id);
        console.log(data);
        setVehicles(vehicles.map((veh, iter) => (
            iter == activeVehicle ?
                { vehicle: veh.vehicle, path: veh.path.map((point, it) => (
                    it == key ?
                        { x: dx, y: dy, z: 0.6 } :
                        { x: point.x, y: point.y, z: 0.6 }
                )), active: veh.active, color: veh.color } :
                { vehicle: veh.vehicle, path: veh.path, active: veh.active, color: veh.color }
        )))
    }

    useEffect(() => {
        console.log(vehicles);
    }, [vehicles]);

    return (
        <div>
            <div className="controls">
                <div className="buttons">
                    <Button className="points-button" variant="contained" onClick={handleDeletePoints}>Delete points</Button>
                    <Button className="points-button" variant="contained" onClick={handleDeleteLast}>Delete last point</Button>
                    <Button className="points-button" variant="contained" onClick={handleUsePoints}>Use these points</Button>
                </div>
                <Button variant="contained" onClick={handleAddVehicle}>Add vehicle</Button>
                <div className="vehicles">
                    {vehicles.map((item, index) => (<div className="vehicle">
                        <InputLabel id={String(index) + "-label"}>Model</InputLabel>
                        <Select
                            labelId={String(index) + "-label"}
                            id={String(index)}
                            value={item.vehicle}
                            label="model"
                            onChange={(event: SelectChangeEvent) =>
                            (setVehicles(vehicles.map((vehicle, it) => (
                                it == index ?
                                    { vehicle: event.target.value, path: vehicle.path, active: vehicle.active, color: vehicle.color } :
                                    { vehicle: vehicle.vehicle, path: vehicle.path, active: vehicle.active, color: vehicle.color }
                            ))))}
                        >
                            {vehicleModels.map((item) => (
                                <MenuItem value={item} key={item}>{item}</MenuItem>
                            ))}
                        </Select>
                        <div className="use_n_delete">
                            <div className={"useVehicle" + (item.active ? " active" : "")} onClick={() => {
                                setVehicles(vehicles.map((veh, it) => (
                                    it == index ?
                                        { vehicle: veh.vehicle, path: veh.path, active: true, color: veh.color } :
                                        { vehicle: veh.vehicle, path: veh.path, active: false, color: veh.color }
                                )));
                                setActiveVehicle(index);
                            }}></div>
                            <IconButton
                                id={String(index)}
                                onClick={() => {
                                    setVehicles(vehicles.filter((veh, it) => index != it))
                                }}
                            >
                                <Delete />
                            </IconButton>
                        </div>
                        <div className="rgb_inputs">
                            <NumericFormat
                                defaultValue={127}
                                customInput={TextField}
                                label={"red"}
                                onValueChange={(values: NumberFormatValues) => (
                                    // setColors(colors.map((color, iter) => (
                                    //     iter == index ?
                                    //         { r: values.floatValue ?? 0, g: color.g, b: color.b } :
                                    //         { r: color.r, g: color.g, b: color.b }
                                    // )))
                                    setVehicles(vehicles.map((veh, iter) => (
                                        iter == index ?
                                            {
                                                vehicle: veh.vehicle,
                                                path: veh.path,
                                                active: veh.active,
                                                color: { r: values.floatValue ?? 0, g: veh.color.g, b: veh.color.b }
                                            } :
                                            {
                                                vehicle: veh.vehicle,
                                                path: veh.path,
                                                active: veh.active,
                                                color: veh.color
                                            }
                                    )))
                                )}
                                isAllowed={(values: NumberFormatValues) => {
                                    const { floatValue, formattedValue } = values;
                                    return (
                                        floatValue === undefined ||
                                        (floatValue >= 0 &&
                                            floatValue <= 255 &&
                                            Math.floor(floatValue) === floatValue &&
                                            !formattedValue.includes('.') &&
                                            !formattedValue.includes('-'))
                                    );
                                }}
                            />
                            <NumericFormat
                                defaultValue={127}
                                customInput={TextField}
                                label={"green"}
                                onValueChange={(values: NumberFormatValues) => (
                                    // setColors(colors.map((color, iter) => (
                                    //     iter == index ?
                                    //         { r: color.r, g: values.floatValue ?? 0, b: color.b } :
                                    //         { r: color.r, g: color.g, b: color.b }
                                    // )))
                                    setVehicles(vehicles.map((veh, iter) => (
                                        iter == index ?
                                            {
                                                vehicle: veh.vehicle,
                                                path: veh.path,
                                                active: veh.active,
                                                color: { r: veh.color.r, g: values.floatValue ?? 0, b: veh.color.b }
                                            } :
                                            {
                                                vehicle: veh.vehicle,
                                                path: veh.path,
                                                active: veh.active,
                                                color: veh.color
                                            }
                                    )))
                                )}
                                isAllowed={(values: NumberFormatValues) => {
                                    const { floatValue, formattedValue } = values;
                                    return (
                                        floatValue === undefined ||
                                        (floatValue >= 0 &&
                                            floatValue <= 255 &&
                                            Math.floor(floatValue) === floatValue &&
                                            !formattedValue.includes('.') &&
                                            !formattedValue.includes('-'))
                                    );
                                }}
                            />
                            <NumericFormat
                                defaultValue={127}
                                customInput={TextField}
                                label={"blue"}
                                onValueChange={(values: NumberFormatValues) => (
                                    // setColors(colors.map((color, iter) => (
                                    //     iter == index ?
                                    //         { r: color.r, g: color.g, b: values.floatValue ?? 0 } :
                                    //         { r: color.r, g: color.g, b: color.b }
                                    // )))
                                    setVehicles(vehicles.map((veh, iter) => (
                                        iter == index ?
                                            {
                                                vehicle: veh.vehicle,
                                                path: veh.path,
                                                active: veh.active,
                                                color: { r: veh.color.r, g: veh.color.g, b: values.floatValue ?? 0 }
                                            } :
                                            {
                                                vehicle: veh.vehicle,
                                                path: veh.path,
                                                active: veh.active,
                                                color: veh.color
                                            }
                                    )))
                                )}
                                isAllowed={(values: NumberFormatValues) => {
                                    const { floatValue, formattedValue } = values;
                                    return (
                                        floatValue === undefined ||
                                        (floatValue >= 0 &&
                                            floatValue <= 255 &&
                                            Math.floor(floatValue) === floatValue &&
                                            !formattedValue.includes('.') &&
                                            !formattedValue.includes('-'))
                                    );
                                }}
                            />
                        </div>
                        <hr className="between-cars" />
                    </div>))}
                </div>
            </div>
            <div
                id="map-img"
                className="image-cont"
                ref={imageRef}
                // onClick={handleClick}
                style={{ width: "4144px", height: "4316px" }}
            >
                <img
                    // id="map-img"
                    className="image"
                    ref={imageRef}
                    src={imgSrc}
                    alt="Your Image"
                    onClick={handleClick}
                />
                {vehicles.map((vehicle) => (
                    vehicle.active ? 
                    <>{vehicle.path.map((point, index) => (
                        <Draggable
                            onStop={handleDragStop}
                            bounds="#map-img"
                            offsetParent={imageRef.current!}
                            key={index}
                            position={point}
                        >
                            <div
                                key={index}
                                id={String(index)}
                                style={{
                                    position: 'absolute',
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: `rgb(${vehicle.color.r}, ${vehicle.color.g}, ${vehicle.color.b})`,
                                    borderRadius: '50%',
                                    border: '3px solid',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            >
                                {index + 1}
                            </div>
                        </Draggable>
                    ))}</> : 
                    <>{vehicle.path.map((point, index) => (
                        <div
                                key={index}
                                id={String(index)}
                                style={{
                                    position: 'absolute',
                                    width: '20px',
                                    height: '20px',
                                    left: point.x + imageRef.current!.getBoundingClientRect().left + window.scrollX,
                                    top: point.y + imageRef.current!.getBoundingClientRect().top + window.scrollY,
                                    backgroundColor: `rgb(${vehicle.color.r}, ${vehicle.color.g}, ${vehicle.color.b})`,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            >
                                {index + 1}
                            </div>
                    ))}</>
                ))}
            </div>
        </div>
    );
}

export default Canvas