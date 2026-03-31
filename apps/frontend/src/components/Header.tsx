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
                                <a href="/home"><img src={hanoverLogo} id="hanover-logo-menu"
                                        alt="Hanover Insurance Logo"
                                        style={{width: '90px'}}/></a></th>

                            <th>The Hanover Insurance Group</th>
                            <th id="menu-spacer"> </th>
                            <th>
                                <div className="menu-links">
                                    <a href="/home"> Home</a>
                                    <a href="/link1"> Link 1</a>
                                    <a href="/link2"> Link 2</a>
                                    <a href="/link3"> Link 3</a>
                                </div>
                            </th>
                        </tr>
                    </thead>
                </table>


            </div>
            </>
        );
}
