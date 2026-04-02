import { ContentPaste, People, Business, Create } from '@mui/icons-material';
import {LinksWithProps, type MenuItem} from "../LinkBubbles.tsx";

const MainMenuLinks: MenuItem[] = [
    { icon: <ContentPaste fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }}  />, label: "Manage Content", path: '/managecontent' },
    { icon: <People fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "Manage Employees", path: '/manageemployees' },
    { icon: <Business fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "Business Analyst Resources", path: '/businessanalyst' },
    { icon: <Create fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "Core Commercial Underwriter Resources", path: 'corecommercialunderwriter' },
];

export function LinksDemo() {
    return (
        <LinksWithProps items={MainMenuLinks} col_lg={2}/>
    );
}
