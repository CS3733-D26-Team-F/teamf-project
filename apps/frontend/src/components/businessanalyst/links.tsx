import type {ReactNode} from 'react'

export function LinksComponent(): ReactNode {
    return (
        <div>
            <table className="analyst_links">
                <tbody>
                <tr>
                    <td>
                        <div id="Error">
                            <img src="../public/analyst_icons/error.webp" width="300" alt="Error" />
                        </div>
                        <div>
                            <h3>Error Lookup Tool</h3>
                        </div>
                    </td>
                    <td>
                        <div id="Kentucky">
                            <img src="../public/analyst_icons/kentucky.png" width="300" alt="Kentucky" />
                        </div>
                        <div>
                            <h3>Kentucky Tax and Tax Exemption Job Aid</h3>
                        </div>
                    </td>
                    <td>
                        <div id="Around">
                            <img src="../public/analyst_icons/around.webp" width="300" alt="Around" />
                        </div>
                        <div>
                            <h3>Workaround Tool</h3>
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
                        <div id="Image">
                            <img src="../public/analyst_icons/image.webp" width="300" alt="Image" />
                        </div>
                        <div>
                            <h3>IPS (Image & Processing System)</h3>
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