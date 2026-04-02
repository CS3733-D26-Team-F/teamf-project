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
                                        style={{width: '100px'}}/></Link></th>
                            <th id="menu-spacer"> </th>
                            <th>
                                <div className="menu-links">
                                    <Link to="/"> Home</Link>
                                    <Link to="/managecontent"> Manage Content</Link>
                                    <Link to="/manageemployees"> Manage Employees</Link>
                                    <Link to="/businessanalyst"> Business Analyst</Link>
                                    <Link to="/corecommercialunderwriter"> Core Commercial Underwriter</Link>
                                </div>
                            </th>
                        </tr>
                    </thead>
                </table>


            </div>
            </>
        );
}
