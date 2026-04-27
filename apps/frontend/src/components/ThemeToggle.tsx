import * as React from 'react';
import Switch from '@mui/material/Switch';
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";

// Custom MUI switch styling so the active state matches the app's theme color.
const ThemeSwitch = styled(Switch)(({theme}) => ({
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
    // Read the saved theme preference; default to the normal theme when none is stored.
    /* theme might not be in local storage yet, which would return it as null */
    const theme = localStorage.getItem("theme") === "high-visibility";
    console.log(theme);

    // Controlled switch state so the UI stays in sync with the stored theme value.
    const [checked, setChecked] = React.useState(
        localStorage.getItem("theme") === "high-visibility"
    );

    React.useEffect(() => {
        // Listen for external theme changes so this toggle updates if another component changes it.
        const handler = (e: Event) => {
            const theme = (e as CustomEvent).detail;
            setChecked(theme === 'high-visibility');
        };
        window.addEventListener('themeChange', handler);
        return () => window.removeEventListener('themeChange', handler);
    }, []);


    // Update local UI state when the user flips the switch.
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
        // Persist the selected theme and apply it to the document root for global styling.
        if (event.target.checked) {
            localStorage.setItem("theme", "high-visibility");
            document.documentElement.setAttribute("data-theme", "high-visibility");
        } else {
            localStorage.setItem("theme", "default");
            document.documentElement.setAttribute("data-theme", " ");
        }
    };

    return (
        <div>
            <div className={"outline outline-white outline-offset-4"}>
                <label className={"text-black"}>{t('blind_theme')}: </label>
                <ThemeSwitch
                    checked={checked}
                    onChange={handleChange}
                    slotProps={{input: {'aria-label': 'controlled'}}}
                />
            </div>
        </div>
    );
}
