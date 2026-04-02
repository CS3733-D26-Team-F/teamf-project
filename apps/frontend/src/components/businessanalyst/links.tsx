import { ErrorOutline, AttachMoney, Loop, Work, CalendarMonth, Image } from '@mui/icons-material';
import {LinksWithProps, type MenuItem} from "../LinkBubbles.tsx";

const AnalystLinks: MenuItem[] = [
    { icon: <ErrorOutline fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }}  />, label: "Error Lookup Tool" },
    { icon: <AttachMoney fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "Kentucky Tax and Tax Exemption Job Aid" },
    { icon: <Loop fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "Workaround Tool" },
    { icon: <Work fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "Underwriting Workstation" },
    { icon: <CalendarMonth fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "Experience & Schedule Rating Plans" },
    { icon: <Image fontSize="large" style={{ color: 'var(--color-yale-blue)' }} sx={{ fontSize: 100 }} />, label: "IPS (Image & Processing System)" },
];

export function LinksDemo() {
    return (
        <LinksWithProps items={AnalystLinks} col_lg={3}/>
    );
}