import * as React from 'react';
import Switch from '@mui/material/Switch';
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";

const ThemeSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: "var(--color-yale-blue)",
        '&:hover': {
            backgroundColor: `rgba(27, 73, 101, ${theme.palette.action.hoverOpacity})`,
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: "var(--color-yale-blue)",
    },
}));


export default function ThemeToggle() {
    const {t} = useTranslation();
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
        <div className={"outline outline-white outline-offset-4" }><label className={"text-black"}>{t('theme')}: </label><ThemeSwitch
                                           checked={checked}
                                           onChange={handleChange}
                                           slotProps={{input: {'aria-label': 'controlled'}}}/>
        </div>
    );
}