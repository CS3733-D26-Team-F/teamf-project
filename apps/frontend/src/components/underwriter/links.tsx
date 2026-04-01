import type {ReactNode} from 'react'

export function LinksComponent(): ReactNode {
    return (
        <div>
            <table className="underwriter_links">
                <tbody>
                <tr>
                    <td>
                        <div id="Meter">
                            <img src="../public/underwriter_icons/Meter.webp" width="300" alt="Meter" />
                        </div>
                        <div>
                            <h3>RiskMeter Online</h3>
                        </div>
                    </td>
                    <td>
                        <div id="Computer">
                            <img src="../public/underwriter_icons/computer.png" width="300" alt="Computer" />
                        </div>
                        <div>
                            <h3>Desktop Management Tool</h3>
                        </div>
                    </td>
                    <td>
                        <div id="House">
                            <img src="../public/underwriter_icons/house.webp" width="300" alt="House" />
                        </div>
                        <div>
                            <h3>Property View</h3>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div id="Work">
                            <img src="../public/underwriter_icons/work.webp" width="300" alt="Work" />
                        </div>
                        <div>
                            <h3>Underwriting Workstation</h3>
                        </div>
                    </td>
                    <td>
                        <div id="Schedule">
                            <img src="../public/underwriter_icons/schedule.webp" width="300" alt="Schedule" />
                        </div>
                        <div>
                            <h3>Experience & Schedule Rating Plans</h3>
                        </div>
                    </td>
                    <td>
                        <div id="Coast">
                            <img src="../public/underwriter_icons/coast.jpg" width="300" alt="Coast" />
                        </div>
                        <div>
                            <h3>Coastal Guidelines</h3>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    )
}

export function LinksDemo() {
    return (
        <LinksComponent />
    )
}