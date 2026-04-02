import {Speed, Computer, House, Work, CalendarMonth, Public} from "@mui/icons-material";
import {LinksWithProps, type MenuItem} from "../LinkBubbles.tsx";

const UnderwriterLinks: MenuItem[] = [
    { icon: <Speed fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }}  />, label: "RiskMeter Online" },
    { icon: <Computer fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Desktop Management Tool" },
    { icon: <House fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Property View" },
    { icon: <Work fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Underwriting Workstation" },
    { icon: <CalendarMonth fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Experience & Schedule Rating Plans" },
    { icon: <Public fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Coastal Guidelines" },
];

export function LinksDemo() {
    return (
        <LinksWithProps items={UnderwriterLinks} col_lg={3}/>
    );
}