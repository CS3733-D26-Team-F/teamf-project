import { useAuth0 } from "@auth0/auth0-react";
import {useState} from "react";
import {Popover} from "@mantine/core";

export function Profile() {
    const { user, isAuthenticated, logout } = useAuth0();
    const [open, setOpen] = useState(false);

    return (
        <Popover opened={open} onChange={setOpen}>
            <Popover.Target>
                <div className="profilePopover"
                     onClick={() => setOpen((o) => !o)}
                     style={{ cursor: "pointer" }}>
                    <img src="https://via.placeholder.com/40" alt="Profile" />
                    <span>{isAuthenticated ? user?.nickname || "Guest" : "Guest"}</span>
                </div>
            </Popover.Target>

            <Popover.Dropdown>
                {isAuthenticated && (
                    <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })
                    }>Logout</button>
                )}
            </Popover.Dropdown>
        </Popover>
    );
}