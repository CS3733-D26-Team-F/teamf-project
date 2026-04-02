import {Speed, Computer, House, Work, CalendarMonth, Public} from "@mui/icons-material";

export function LinksComponent() {

    const items = [
        { icon: <Speed fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }}  />, label: "RiskMeter Online" },
        { icon: <Computer fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Desktop Management Tool" },
        { icon: <House fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Property View" },
        { icon: <Work fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Underwriting Workstation" },
        { icon: <CalendarMonth fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Experience & Schedule Rating Plans" },
        { icon: <Public fontSize="large" style={{ color: "#1B4965" }} sx={{ fontSize: 100 }} />, label: "Coastal Guidelines" },
    ];

    return (
        <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="
                            flex flex-col items-center justify-center
                            bg-[#CAE9FF] rounded-xl p-6 shadow
                            hover:bg-gray-300 hover:shadow-lg
                            transition-all duration-200 cursor-pointer
                            h-48 sm:h-56 lg:h-64
                        "
                    >
                        <div className="h-20 flex items-center justify-center">
                            {item.icon}
                        </div>
                        <br />
                        <h3 className="text-center font-semibold text-[#1B4965]">
                            {item.label}
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function LinksDemo() {
    return (
        <LinksComponent />
    )
}