import * as React from 'react';
import Switch from '@mui/material/Switch';
import {alpha, styled} from "@mui/material";

const ThemeSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: "#ff9800",
        '&:hover': {
            backgroundColor: alpha("#ff9800", theme.palette.action.hoverOpacity),
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: "#ff9800",
    },
}));


export default function ThemeToggle() {
    /* theme might not be in local storage yet, which would return it as null */
    const theme = localStorage.getItem("theme") === "high-visibility";

    const [checked, setChecked] = React.useState(theme);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };

    if (checked) {
        localStorage.setItem("theme", "high-visibility");
        document.documentElement.setAttribute("data-theme", "high-visibility");
    }

    else{
        localStorage.setItem("theme", "default");
        document.documentElement.setAttribute("data-theme", " ");
    }

    return (
        <div className={"outline outline-white outline-offset-4" }><label className={"text-white"}>Theme: </label><ThemeSwitch
                                           checked={checked}
                                           onChange={handleChange}
                                           slotProps={{input: {'aria-label': 'controlled'}}}/>
        </div>
    );
}