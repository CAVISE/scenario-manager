import { NumberFormatValues, NumericFormat } from "react-number-format";
import { TextField } from "@mui/material";
import { InputNumberProps } from "../types/Scenario";

const InputNumber = ({param, state, setState}: InputNumberProps) => {

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
