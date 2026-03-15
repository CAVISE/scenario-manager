import { NumberFormatValues, NumericFormat } from "react-number-format";
import { TextField } from "@mui/material";

import World from "../../../types/Scenario";

interface Props {
    param: keyof World,
    state: World,
    setState: (world: World) => void
}

const InputNumber = ({param, state, setState}: Props) => {

    const handleChange = (values: NumberFormatValues) => {
        setState({...state, [param]: values.floatValue as number})
    }

    return(<NumericFormat
        customInput={TextField}
        label={param}
        value={state[param] as string}
        onValueChange={handleChange}
    />)
}

export default InputNumber
