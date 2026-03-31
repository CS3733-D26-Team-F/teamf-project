import { Link } from 'react-router-dom'
import hanoverLogo from '../assets/hanoverlogo.png';


export function Header() {
    return (
            <>
            <div className="menu">
                <table className="menu-content">

                    <thead>
                        <tr>
                            <th>
                                <Link to="/"><img src={hanoverLogo} id="hanover-logo-menu"
                                        alt="Hanover Insurance Logo"
                                        style={{width: '90px'}}/></Link></th>

                            <th>The Hanover Insurance Group</th>
                            <th id="menu-spacer"> </th>
                            <th>
                                <div className="menu-links">
                                    <Link to="/"> Home</Link>
                                    <Link to="/link1"> Manage Content</Link>
                                    <Link to="/link2"> Manage Employees</Link>
                                    <Link to="/link3"> Business Analyst</Link>
                                    <Link to="/link3"> Core Commercial Underwriter</Link>
                                </div>
                            </th>
                        </tr>
                    </thead>
                </table>


            </div>
            </>
        );
}
