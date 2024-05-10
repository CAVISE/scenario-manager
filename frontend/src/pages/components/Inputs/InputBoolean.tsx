import { Checkbox, FormControlLabel } from "@mui/material";

import World from "../../../types/Scenario";

interface Props {
    param: keyof World,
    state: World,
    setState: (world: World) => void
}

const InputBoolean = ({param, state, setState}: Props) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState({...state, [param]: event.target.checked})
        console.log(state)
    }

    return(
        <FormControlLabel 
            label={param} 
            control={<Checkbox checked={state[param] as boolean} onChange={handleChange}/>}
        />
    )
}

export default InputBoolean